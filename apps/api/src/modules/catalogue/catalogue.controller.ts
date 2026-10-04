import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CatalogueService } from './catalogue.service';
import {
  CatalogueQueryDto,
  CreateDishDto,
  CreateOptionDto,
  UpdateDishDto,
  UpdateOptionDto,
} from './dto/catalogue.dto';

@Controller('catalogue')
@UseGuards(AuthGuard, CapabilityGuard)
export class CatalogueController {
  constructor(
    private readonly catalogue: CatalogueService,
  ) {}

  @Get('dishes')
  @RequireCapabilities('catalogue.read')
  listDishes(@Query() query: CatalogueQueryDto) {
    return this.catalogue.listDishes(query);
  }

  @Get('options')
  @RequireCapabilities('catalogue.read')
  listOptions(@Query() query: CatalogueQueryDto) {
    return this.catalogue.listOptions(query);
  }

  @Post('dishes')
  @RequireCapabilities('catalogue.manage')
  createDish(@Body() dto: CreateDishDto) {
    return this.catalogue.createDish(dto);
  }

  @Patch('dishes/:id')
  @RequireCapabilities('catalogue.manage')
  updateDish(@Param('id') id: string, @Body() dto: UpdateDishDto) {
    return this.catalogue.updateDish(id, dto);
  }

  @Patch('dishes/:id/status')
  @RequireCapabilities('catalogue.manage')
  setDishStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.catalogue.setDishActive(id, isActive);
  }

  @Post('options')
  @RequireCapabilities('catalogue.manage')
  createOption(@Body() dto: CreateOptionDto) {
    return this.catalogue.createOption(dto);
  }

  @Patch('options/:id')
  @RequireCapabilities('catalogue.manage')
  updateOption(@Param('id') id: string, @Body() dto: UpdateOptionDto) {
    return this.catalogue.updateOption(id, dto);
  }

  @Patch('options/:id/status')
  @RequireCapabilities('catalogue.manage')
  setOptionStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.catalogue.setOptionActive(id, isActive);
  }
}
