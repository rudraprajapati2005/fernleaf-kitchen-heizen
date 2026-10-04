import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { UpdateDeliveryConfigDto } from './dto/delivery-config.dto';

const PUBLIC_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com']);
type AddressInput = { label: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country?: string; isActive?: boolean };

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.company.findMany({ include: { emailDomains: true, deliveryAddresses: true, ownerEmployee: true, defaultDriver: true, defaultDeliveryAddress: true }, orderBy: { name: 'asc' } }); }
  get(id: string) { return this.prisma.company.findUniqueOrThrow({ where: { id }, include: { employees: true, emailDomains: true, deliveryAddresses: true, ownerEmployee: true, defaultDriver: true, defaultDeliveryAddress: true } }); }
  getDeliveryConfig(id: string) { return this.prisma.company.findUniqueOrThrow({ where: { id }, select: { id: true, defaultDeliveryTime: true, kitchenDepartureLeadMinutes: true, defaultPackaging: true, driverInstructions: true, defaultDriver: { select: { id: true, name: true, email: true, role: true } }, defaultDeliveryAddress: true } }); }
  async create(body: { name: string; billingContactName?: string; billingContactEmail?: string; billingContactPhone?: string; ownerEmployeeId?: string }) {
    const companyData = {
      name: body.name,
      billingContactName: body.billingContactName ?? null,
      billingContactEmail: body.billingContactEmail ?? null,
      billingContactPhone: body.billingContactPhone ?? null,
    };
    const company = await this.prisma.company.create({ data: companyData });
    if (!body.ownerEmployeeId) return company;
    await this.validateOwner(body.ownerEmployeeId, company.id);
    return this.prisma.company.update({ where: { id: company.id }, data: { ownerEmployeeId: body.ownerEmployeeId } });
  }
  async update(id: string, body: Record<string, unknown>) { await this.validateOwner(typeof body.ownerEmployeeId === 'string' ? body.ownerEmployeeId : undefined, id); return this.prisma.company.update({ where: { id }, data: body }); }
  async addDomain(companyId: string, raw: string) {
    const domain = raw.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)+$/.test(domain)) throw new BadRequestException('Invalid email domain');
    if (PUBLIC_DOMAINS.has(domain)) throw new BadRequestException('Public email domains cannot be claimed');
    try { return await this.prisma.companyEmailDomain.create({ data: { companyId, domain } }); } catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new ConflictException('Email domain is already claimed'); throw error; }
  }
  removeDomain(companyId: string, id: string) { return this.prisma.companyEmailDomain.delete({ where: { id, companyId } }); }
  addAddress(companyId: string, body: AddressInput) { return this.prisma.companyDeliveryAddress.create({ data: { ...body, companyId, country: body.country ?? 'US' } }); }
  async updateAddress(companyId: string, id: string, body: Partial<AddressInput>) {
    const address = await this.prisma.companyDeliveryAddress.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!address) throw new NotFoundException('Delivery address not found');
    return this.prisma.companyDeliveryAddress.update({ where: { id }, data: body });
  }
  async addressSnapshot(companyId: string, id: string) {
    const address = await this.prisma.companyDeliveryAddress.findFirst({ where: { id, companyId, isActive: true } });
    if (!address) throw new BadRequestException('An active address from this company is required');
    return { label: address.label, addressLine1: address.addressLine1, addressLine2: address.addressLine2, city: address.city, state: address.state, postalCode: address.postalCode, country: address.country };
  }
  async updateDeliveryConfig(companyId: string, dto: UpdateDeliveryConfigDto) {
    await this.ensureCompanyForDelivery(companyId);
    if (dto.defaultDeliveryTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.defaultDeliveryTime)) {
      throw new BadRequestException('Default delivery time must use HH:mm');
    }
    if (dto.kitchenDepartureLeadMinutes !== undefined && (!Number.isInteger(dto.kitchenDepartureLeadMinutes) || dto.kitchenDepartureLeadMinutes < 1 || dto.kitchenDepartureLeadMinutes > 1440)) {
      throw new BadRequestException('Kitchen departure lead time must be between 1 and 1440 minutes');
    }
    if (dto.defaultDriverId !== undefined) {
      const driver = await this.prisma.user.findFirst({ where: { id: dto.defaultDriverId, role: UserRole.DRIVER, isActive: true }, select: { id: true } });
      if (!driver) throw new BadRequestException('Default driver must be an active DRIVER staff account');
    }
    if (dto.defaultDeliveryAddressId !== undefined) {
      const address = await this.prisma.companyDeliveryAddress.findFirst({ where: { id: dto.defaultDeliveryAddressId, companyId, isActive: true }, select: { id: true } });
      if (!address) throw new BadRequestException('Default delivery address must be an active address for this company');
    }
    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.defaultDeliveryTime === undefined ? {} : { defaultDeliveryTime: dto.defaultDeliveryTime }),
        ...(dto.kitchenDepartureLeadMinutes === undefined ? {} : { kitchenDepartureLeadMinutes: dto.kitchenDepartureLeadMinutes }),
        ...(dto.defaultPackaging === undefined ? {} : { defaultPackaging: dto.defaultPackaging }),
        ...(dto.driverInstructions === undefined ? {} : { driverInstructions: dto.driverInstructions.trim() || null }),
        ...(dto.defaultDriverId === undefined ? {} : { defaultDriver: { connect: { id: dto.defaultDriverId } } }),
        ...(dto.defaultDeliveryAddressId === undefined ? {} : { defaultDeliveryAddress: { connect: { id: dto.defaultDeliveryAddressId } } }),
      },
      select: { id: true, defaultDeliveryTime: true, kitchenDepartureLeadMinutes: true, defaultPackaging: true, driverInstructions: true, defaultDriver: { select: { id: true, name: true, email: true, role: true } }, defaultDeliveryAddress: true },
    });
  }
  private async ensureCompanyForDelivery(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
  }
  private async validateOwner(employeeId?: string, companyId?: string) { if (!employeeId) return; const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } }); if (!employee || (companyId && employee.companyId !== companyId)) throw new BadRequestException('Company owner must belong to the company'); }
}
