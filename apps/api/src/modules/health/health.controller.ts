import { Controller, Get, Query, ServiceUnavailableException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class HealthQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  verbose?: boolean;
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(@Query() query: HealthQueryDto): Promise<Record<string, unknown>> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database connectivity check failed');
    }

    return {
      status: 'ok',
      database: 'ok',
      ...(query.verbose ? { timestamp: new Date().toISOString() } : {}),
    };
  }
}
