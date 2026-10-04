import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

const employeeInclude = {
  company: true,
  allergies: true,
  dietaryPreferences: true,
} as const;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.employee.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { name: 'asc' },
      include: employeeInclude,
    });
  }

  async get(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id }, include: employeeInclude });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    await this.ensureCompany(dto.companyId);
    await this.ensurePreferences(dto.allergenIds ?? [], dto.dietaryPreferenceIds ?? []);
    return this.prisma.employee.create({
      data: this.employeeData(dto, 'create'),
      include: employeeInclude,
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { id }, select: { id: true, companyId: true } });
    if (!existing) throw new NotFoundException('Employee not found');
    await this.ensureCompany(dto.companyId);
    await this.ensurePreferences(dto.allergenIds ?? [], dto.dietaryPreferenceIds ?? []);

    if (dto.companyId !== existing.companyId) {
      const ownedCompany = await this.prisma.company.findFirst({ where: { ownerEmployeeId: id }, select: { id: true } });
      if (ownedCompany) {
        throw new BadRequestException('A company owner must be reassigned before moving this employee');
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: this.employeeData(dto, 'update'),
      include: employeeInclude,
    });
  }

  private employeeData(dto: CreateEmployeeDto | UpdateEmployeeDto, mode: 'create' | 'update') {
    return {
      name: dto.name.trim(),
      company: { connect: { id: dto.companyId } },
      ...(dto.email === undefined ? {} : { email: dto.email?.toLowerCase() ?? null }),
      ...(dto.phone === undefined ? {} : { phone: dto.phone?.trim() ?? null }),
      ...('isActive' in dto && dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.canChooseOwnDeliveryAddress === undefined ? {} : { canChooseOwnDeliveryAddress: dto.canChooseOwnDeliveryAddress }),
      ...(dto.canChangeDeliveryTime === undefined ? {} : { canChangeDeliveryTime: dto.canChangeDeliveryTime }),
      ...(dto.canChangePackaging === undefined ? {} : { canChangePackaging: dto.canChangePackaging }),
      ...(mode === 'create'
        ? { allergies: { connect: (dto.allergenIds ?? []).map((id) => ({ id })) }, dietaryPreferences: { connect: (dto.dietaryPreferenceIds ?? []).map((id) => ({ id })) } }
        : { allergies: { set: (dto.allergenIds ?? []).map((id) => ({ id })) }, dietaryPreferences: { set: (dto.dietaryPreferenceIds ?? []).map((id) => ({ id })) } }),
    };
  }

  private async ensureCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, isActive: true } });
    if (!company) throw new NotFoundException('Company not found');
    if (!company.isActive) throw new BadRequestException('Employees cannot be assigned to an inactive company');
  }

  private async ensurePreferences(allergenIds: string[], dietaryPreferenceIds: string[]) {
    const [allergens, dietaryTags] = await Promise.all([
      this.prisma.allergen.findMany({ where: { id: { in: allergenIds }, isActive: true }, select: { id: true } }),
      this.prisma.dietaryTag.findMany({ where: { id: { in: dietaryPreferenceIds }, isActive: true }, select: { id: true } }),
    ]);
    if (allergens.length !== allergenIds.length) throw new BadRequestException('Invalid or inactive allergy');
    if (dietaryTags.length !== dietaryPreferenceIds.length) throw new BadRequestException('Invalid or inactive dietary preference');
  }
}
