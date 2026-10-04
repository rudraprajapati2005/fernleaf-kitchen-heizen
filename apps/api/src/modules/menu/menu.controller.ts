import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { MenuService } from './menu.service';
@Controller('menu')
@UseGuards(AuthGuard, CapabilityGuard)
export class MenuController {
  constructor(private readonly menu: MenuService) {}
  @Get('employees/:employeeId') @RequireCapabilities('employee.read') resolve(@Param('employeeId') employeeId: string, @Query('secret') secret?: string) { return this.menu.resolveForEmployee(employeeId, secret === 'true'); }
}
