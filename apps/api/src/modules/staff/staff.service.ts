import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { CreateStaffDto } from './dto/create-staff.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string, role?: UserRole) {
    return this.prisma.user.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(role ? { role } : {}),
      },
      orderBy: { name: 'asc' },
      select: publicUserSelect,
    });
  }

  async create(dto: CreateStaffDto) {
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          name: dto.name.trim(),
          passwordHash: await bcrypt.hash(dto.password, 12),
          role: dto.role,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A staff account with this email already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 12) } : {}),
          ...(dto.role ? { role: dto.role } : {}),
          ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A staff account with this email already exists');
      }
      throw error;
    }
  }

  async setActive(id: string, isActive: boolean) {
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: publicUserSelect,
    });
  }

  private async ensureExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Staff account not found');
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
