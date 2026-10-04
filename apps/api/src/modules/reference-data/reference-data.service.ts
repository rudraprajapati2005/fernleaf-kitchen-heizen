import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReferenceDataDto, UpdateReferenceDataDto } from './dto/reference-data.dto';

export type ReferenceType = 'allergens' | 'dietary-tags' | 'kitchen-stations';

@Injectable()
export class ReferenceDataService {
  constructor(private readonly prisma: PrismaService) {}

  list(type: ReferenceType, search?: string, activeOnly = true) {
    this.assertType(type);
    const where = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };
    if (type === 'allergens')
      return this.prisma.allergen.findMany({ where, orderBy: { name: 'asc' } });
    if (type === 'dietary-tags')
      return this.prisma.dietaryTag.findMany({ where, orderBy: { name: 'asc' } });
    return this.prisma.kitchenStation.findMany({ where, orderBy: { name: 'asc' } });
  }

  async create(type: ReferenceType, dto: CreateReferenceDataDto) {
    this.assertType(type);
    try {
      if (type === 'allergens')
        return await this.prisma.allergen.create({ data: { name: dto.name.trim() } });
      if (type === 'dietary-tags')
        return await this.prisma.dietaryTag.create({ data: { name: dto.name.trim() } });
      return await this.prisma.kitchenStation.create({ data: { name: dto.name.trim() } });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A reference value with this name already exists');
      }
      throw error;
    }
  }

  async update(type: ReferenceType, id: string, dto: UpdateReferenceDataDto) {
    this.assertType(type);
    await this.ensureExists(type, id);
    try {
      const data = {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
      };
      if (type === 'allergens') return await this.prisma.allergen.update({ where: { id }, data });
      if (type === 'dietary-tags')
        return await this.prisma.dietaryTag.update({ where: { id }, data });
      return await this.prisma.kitchenStation.update({ where: { id }, data });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A reference value with this name already exists');
      }
      throw error;
    }
  }

  async ensureActiveIds(type: ReferenceType, ids: string[]): Promise<void> {
    this.assertType(type);
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return;
    const records =
      type === 'allergens'
        ? await this.prisma.allergen.findMany({
            where: { id: { in: uniqueIds }, isActive: true },
            select: { id: true },
          })
        : type === 'dietary-tags'
          ? await this.prisma.dietaryTag.findMany({
              where: { id: { in: uniqueIds }, isActive: true },
              select: { id: true },
            })
          : await this.prisma.kitchenStation.findMany({
              where: { id: { in: uniqueIds }, isActive: true },
              select: { id: true },
            });
    if (records.length !== uniqueIds.length) {
      throw new NotFoundException(`One or more ${type} are missing or inactive`);
    }
  }

  private async ensureExists(type: ReferenceType, id: string): Promise<void> {
    const record =
      type === 'allergens'
        ? await this.prisma.allergen.findUnique({ where: { id }, select: { id: true } })
        : type === 'dietary-tags'
          ? await this.prisma.dietaryTag.findUnique({ where: { id }, select: { id: true } })
          : await this.prisma.kitchenStation.findUnique({ where: { id }, select: { id: true } });
    if (!record) throw new NotFoundException('Reference value not found');
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private assertType(type: string): asserts type is ReferenceType {
    if (type !== 'allergens' && type !== 'dietary-tags' && type !== 'kitchen-stations') {
      throw new BadRequestException('Unknown reference data type');
    }
  }
}
