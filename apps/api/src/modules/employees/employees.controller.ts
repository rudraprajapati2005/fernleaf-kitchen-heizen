import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(AuthGuard, CapabilityGuard)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequireCapabilities('employee.read')
  list(@Query('companyId') companyId?: string) {
    return this.employees.list(companyId);
  }

  @Get(':id')
  @RequireCapabilities('employee.read')
  get(@Param('id') id: string) {
    return this.employees.get(id);
  }

  @Post()
  @RequireCapabilities('employee.manage')
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Patch(':id')
  @RequireCapabilities('employee.manage')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }
}
