import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CalendarService } from './calendar.service';
@Controller('companies/:companyId/calendar')
@UseGuards(AuthGuard, CapabilityGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}
  @Get() @RequireCapabilities('company.read') get(@Param('companyId') id: string) { return this.calendar.get(id); }
  @Patch('working-days') @RequireCapabilities('company.manage') days(@Param('companyId') id: string, @Body('workingDays') workingDays: number[]) { return this.calendar.setWorkingDays(id, workingDays); }
  @Post('holidays') @RequireCapabilities('company.manage') add(@Param('companyId') id: string, @Body() body: { date: string; label?: string }) { return this.calendar.addHoliday(id, body); }
  @Delete('holidays/:holidayId') @RequireCapabilities('company.manage') remove(@Param('holidayId') id: string) { return this.calendar.removeHoliday(id); }
}
