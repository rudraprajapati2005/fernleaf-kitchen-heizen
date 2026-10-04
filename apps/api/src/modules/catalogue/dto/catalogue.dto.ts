import { DishTemperature } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CatalogueQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DishTemperature)
  temperature?: DishTemperature;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit = 20;
}

export class CreateDishDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sku?: string;

  @IsOptional()
  @IsEnum(DishTemperature)
  temperature?: DishTemperature;

  @IsDecimal()
  costPrice?: string;

  /** @deprecated Use costPrice. Kept for compatibility with older API clients. */
  @IsOptional()
  @IsDecimal()
  price?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumOrderQuantity?: number;

  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergenIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTagIds?: string[];
}

export class UpdateDishDto extends CreateDishDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateOptionDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsDecimal()
  cost?: string;

  /** @deprecated Use cost. Kept for compatibility with older API clients. */
  @IsOptional()
  @IsDecimal()
  priceAdjustment?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergenIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTagIds?: string[];
}

export class UpdateOptionDto extends CreateOptionDto {}
