import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { PricingService, type TierInput } from './pricing.service';

@Controller('pricing')
@UseGuards(AuthGuard, CapabilityGuard)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}
  @Get('tiers') @RequireCapabilities('catalogue.read') list() { return this.pricing.listTiers(); }
  @Post('tiers') @RequireCapabilities('catalogue.manage') create(@Body() body: TierInput) { return this.pricing.createTier(body); }
  @Patch('tiers/:id') @RequireCapabilities('catalogue.manage') update(@Param('id') id: string, @Body() body: TierInput) { return this.pricing.updateTier(id, body); }
  @Patch('companies/:companyId/tier') @RequireCapabilities('company.manage') assign(@Param('companyId') companyId: string, @Body('tierId') tierId: string) { return this.pricing.assignCompanyTier(companyId, tierId); }
  @Patch('dishes/:dishId') @RequireCapabilities('catalogue.manage') setDish(@Param('dishId') id: string, @Body('tierId') tierId: string, @Body('price') price: string) { return this.pricing.setDishPrice(id, tierId, price); }
  @Patch('options/:optionId') @RequireCapabilities('catalogue.manage') setOption(@Param('optionId') id: string, @Body('tierId') tierId: string, @Body('price') price: string) { return this.pricing.setOptionPrice(id, tierId, price); }
}
