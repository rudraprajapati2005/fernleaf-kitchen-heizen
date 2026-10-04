import { IsArray, IsDecimal, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDishDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDecimal()
  price!: string;

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

export class CreateOptionDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsDecimal()
  priceAdjustment!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergenIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTagIds?: string[];
}
