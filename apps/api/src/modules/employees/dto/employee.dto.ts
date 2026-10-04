import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  companyId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  canChooseOwnDeliveryAddress?: boolean;

  @IsOptional()
  @IsBoolean()
  canChangeDeliveryTime?: boolean;

  @IsOptional()
  @IsBoolean()
  canChangePackaging?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergenIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferenceIds?: string[];
}

export class UpdateEmployeeDto extends CreateEmployeeDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
