import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CreateDishDto, CreateOptionDto } from './dto/catalogue.dto';
import { CatalogueService } from './catalogue.service';

@Controller('catalogue')
@UseGuards(AuthGuard, CapabilityGuard)
@RequireCapabilities('catalogue.manage')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Post('dishes')
  createDish(@Body() dto: CreateDishDto) {
    return this.catalogue.createDish(dto);
  }

  @Post('options')
  createOption(@Body() dto: CreateOptionDto) {
    return this.catalogue.createOption(dto);
  }
}
