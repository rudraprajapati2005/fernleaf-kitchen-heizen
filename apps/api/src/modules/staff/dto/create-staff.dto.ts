import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
