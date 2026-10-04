import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class StaffQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class StaffStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
