import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto, StaffStatusDto } from './dto/staff-query.dto';
import { StaffService } from './staff.service';

@Controller('staff')
@UseGuards(AuthGuard, CapabilityGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @RequireCapabilities('staff.manage')
  list(@Query() query: StaffQueryDto) {
    return this.staff.list(query.search, query.role);
  }

  @Post()
  @RequireCapabilities('staff.manage')
  create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto);
  }

  @Patch(':id')
  @RequireCapabilities('staff.manage')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(id, dto);
  }

  @Patch(':id/status')
  @RequireCapabilities('staff.manage')
  setStatus(@Param('id') id: string, @Body() body: StaffStatusDto) {
    return this.staff.setActive(id, body.isActive);
  }
}
