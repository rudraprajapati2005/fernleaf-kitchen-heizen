import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CapabilityGuard } from '../authorization/capability.guard';
import { RequireCapabilities } from '../authorization/require-capabilities.decorator';
import { CategoriesService } from './categories.service';

@Controller('menu/categories')
@UseGuards(AuthGuard, CapabilityGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() @RequireCapabilities('catalogue.read') list() { return this.categories.list(); }
  @Post() @RequireCapabilities('catalogue.manage') create(@Body() body: { name: string; displayOrder: number }) { return this.categories.create(body); }
  @Patch(':id') @RequireCapabilities('catalogue.manage') update(@Param('id') id: string, @Body() body: { name?: string; displayOrder?: number; isActive?: boolean }) { return this.categories.update(id, body); }
  @Patch('order') @RequireCapabilities('catalogue.manage') reorder(@Body() body: { ids: string[] }) { return this.categories.reorder(body.ids); }
  @Post(':id/dishes') @RequireCapabilities('catalogue.manage') addDish(@Param('id') id: string, @Body() body: { dishId: string; displayOrder: number }) { return this.categories.addDish(id, body); }
  @Delete(':id/dishes/:dishId') @RequireCapabilities('catalogue.manage') removeDish(@Param('id') id: string, @Param('dishId') dishId: string) { return this.categories.removeDish(id, dishId); }
  @Patch(':id/dishes/order') @RequireCapabilities('catalogue.manage') reorderDishes(@Param('id') id: string, @Body() body: { ids: string[] }) { return this.categories.reorderDishes(id, body.ids); }
  @Patch(':id/status') @RequireCapabilities('catalogue.manage') status(@Param('id') id: string, @Body('isActive') isActive: boolean) { return this.categories.update(id, { isActive }); }
  @Patch(':id/dishes/:dishId/status') @RequireCapabilities('catalogue.manage') dishStatus(@Param('id') id: string, @Param('dishId') dishId: string, @Body('isActive') isActive: boolean) { return this.categories.setDishActive(id, dishId, isActive); }
}
