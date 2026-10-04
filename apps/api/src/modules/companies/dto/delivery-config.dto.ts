import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { PackagingType } from '@prisma/client';

export class UpdateDeliveryConfigDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  defaultDeliveryTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  kitchenDepartureLeadMinutes?: number;

  @IsOptional()
  @IsEnum(PackagingType)
  defaultPackaging?: PackagingType;

  @IsOptional()
  @IsString()
  driverInstructions?: string;

  @IsOptional()
  @IsString()
  defaultDriverId?: string;

  @IsOptional()
  @IsString()
  defaultDeliveryAddressId?: string;
}
