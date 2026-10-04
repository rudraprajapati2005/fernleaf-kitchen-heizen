import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CreateReferenceDataDto, UpdateReferenceDataDto } from './dto/reference-data.dto';
import { ReferenceDataService, type ReferenceType } from './reference-data.service';

@Controller('reference-data')
@UseGuards(AuthGuard, CapabilityGuard)
export class ReferenceDataController {
  constructor(private readonly references: ReferenceDataService) {}

  @Get(':type')
  @RequireCapabilities('catalogue.read')
  list(
    @Param('type') type: ReferenceType,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly = 'true',
  ) {
    return this.references.list(type, search, activeOnly !== 'false');
  }

  @Post(':type')
  @RequireCapabilities('catalogue.manage')
  create(@Param('type') type: ReferenceType, @Body() dto: CreateReferenceDataDto) {
    return this.references.create(type, dto);
  }

  @Patch(':type/:id')
  @RequireCapabilities('catalogue.manage')
  update(
    @Param('type') type: ReferenceType,
    @Param('id') id: string,
    @Body() dto: UpdateReferenceDataDto,
  ) {
    return this.references.update(type, id, dto);
  }
}
