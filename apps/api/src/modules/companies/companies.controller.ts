import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CompaniesService } from './companies.service';
import { UpdateDeliveryConfigDto } from './dto/delivery-config.dto';

@Controller('companies')
@UseGuards(AuthGuard, CapabilityGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}
  @Get() @RequireCapabilities('company.read') list() { return this.companies.list(); }
  @Get(':id') @RequireCapabilities('company.read') get(@Param('id') id: string) { return this.companies.get(id); }
  @Get(':id/delivery-config') @RequireCapabilities('company.read') deliveryConfig(@Param('id') id: string) { return this.companies.getDeliveryConfig(id); }
  @Patch(':id/delivery-config') @RequireCapabilities('company.manage') updateDeliveryConfig(@Param('id') id: string, @Body() dto: UpdateDeliveryConfigDto) { return this.companies.updateDeliveryConfig(id, dto); }
  @Post() @RequireCapabilities('company.manage') create(@Body() body: { name: string; billingContactName?: string; billingContactEmail?: string; billingContactPhone?: string; ownerEmployeeId?: string }) { return this.companies.create(body); }
  @Patch(':id') @RequireCapabilities('company.manage') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.companies.update(id, body); }
  @Post(':id/domains') @RequireCapabilities('company.manage') addDomain(@Param('id') id: string, @Body('domain') domain: string) { return this.companies.addDomain(id, domain); }
  @Delete(':id/domains/:domainId') @RequireCapabilities('company.manage') removeDomain(@Param('id') id: string, @Param('domainId') domainId: string) { return this.companies.removeDomain(id, domainId); }
  @Post(':id/addresses') @RequireCapabilities('company.manage') addAddress(@Param('id') id: string, @Body() body: { label: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country?: string; isActive?: boolean }) { return this.companies.addAddress(id, body); }
  @Patch(':id/addresses/:addressId') @RequireCapabilities('company.manage') updateAddress(@Param('id') id: string, @Param('addressId') addressId: string, @Body() body: Record<string, unknown>) { return this.companies.updateAddress(id, addressId, body); }
  @Patch(':id/addresses/:addressId/status') @RequireCapabilities('company.manage') addressStatus(@Param('addressId') addressId: string, @Body('isActive') isActive: boolean) { return this.companies.updateAddress('', addressId, { isActive }); }
}
