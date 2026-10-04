import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateReferenceDataDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class UpdateReferenceDataDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
