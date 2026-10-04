import { Body, Controller, Get, Param, Patch, Post, Delete, Query, UseGuards } from '@nestjs/common';
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
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  ReorderDto,
  CreatePortionSizeDto,
  UpdateGroupPortionsDto,
  UpdateGroupOptionPortionsDto,
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

  @Get('dishes/:dishId/option-groups')
  @RequireCapabilities('catalogue.read')
  listGroups(@Param('dishId') dishId: string) { return this.catalogue.listDishGroups(dishId); }

  @Post('dishes/:dishId/option-groups')
  @RequireCapabilities('catalogue.manage')
  createGroup(@Param('dishId') dishId: string, @Body() dto: CreateOptionGroupDto) { return this.catalogue.createGroup(dishId, dto); }

  @Patch('option-groups/:id')
  @RequireCapabilities('catalogue.manage')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateOptionGroupDto) { return this.catalogue.updateGroup(id, dto); }

  @Delete('option-groups/:id')
  @RequireCapabilities('catalogue.manage')
  deleteGroup(@Param('id') id: string) { return this.catalogue.deleteGroup(id); }

  @Patch('dishes/:dishId/option-groups/order')
  @RequireCapabilities('catalogue.manage')
  reorderGroups(@Param('dishId') dishId: string, @Body() dto: ReorderDto) { return this.catalogue.reorderGroups(dishId, dto); }

  @Patch('option-groups/:groupId/options/order')
  @RequireCapabilities('catalogue.manage')
  reorderOptions(@Param('groupId') groupId: string, @Body() dto: ReorderDto) { return this.catalogue.reorderGroupOptions(groupId, dto); }

  @Get('portion-sizes')
  @RequireCapabilities('catalogue.read')
  listPortionSizes(@Query('activeOnly') activeOnly?: string) { return this.catalogue.listPortionSizes(activeOnly !== 'false'); }

  @Post('portion-sizes')
  @RequireCapabilities('catalogue.manage')
  createPortionSize(@Body() dto: CreatePortionSizeDto) { return this.catalogue.createPortionSize(dto); }

  @Patch('portion-sizes/:id/status')
  @RequireCapabilities('catalogue.manage')
  setPortionSizeStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) { return this.catalogue.setPortionSizeActive(id, isActive); }

  @Patch('option-groups/:groupId/portions')
  @RequireCapabilities('catalogue.manage')
  configureGroupPortions(@Param('groupId') groupId: string, @Body() dto: UpdateGroupPortionsDto) { return this.catalogue.configureGroupPortions(groupId, dto); }

  @Patch('group-options/:id/portions')
  @RequireCapabilities('catalogue.manage')
  configureGroupOptionPortions(@Param('id') id: string, @Body() dto: UpdateGroupOptionPortionsDto) { return this.catalogue.configureGroupOptionPortions(id, dto); }
}
