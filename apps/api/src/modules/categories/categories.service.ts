import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.menuCategory.findMany({ orderBy: { displayOrder: 'asc' }, include: { dishes: { orderBy: { displayOrder: 'asc' }, include: { dish: true } } } }); }
  create(body: { name: string; displayOrder: number }) { return this.prisma.menuCategory.create({ data: { name: body.name.trim(), displayOrder: body.displayOrder } }); }
  update(id: string, body: { name?: string; displayOrder?: number; isActive?: boolean }) { return this.prisma.menuCategory.update({ where: { id }, data: { ...(body.name === undefined ? {} : { name: body.name.trim() }), ...(body.displayOrder === undefined ? {} : { displayOrder: body.displayOrder }), ...(body.isActive === undefined ? {} : { isActive: body.isActive }) } }); }
  async addDish(categoryId: string, body: { dishId: string; displayOrder: number }) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    const dish = await this.prisma.dish.findUnique({ where: { id: body.dishId }, select: { id: true, isActive: true } });
    if (!dish) throw new NotFoundException('Dish not found');
    if (!dish.isActive) throw new BadRequestException('Inactive dishes cannot be added to a category');
    try { return await this.prisma.menuCategoryDish.create({ data: { categoryId, dishId: body.dishId, displayOrder: body.displayOrder }, include: { dish: true } }); }
    catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new ConflictException('Dish is already in this category'); throw error; }
  }
  removeDish(categoryId: string, dishId: string) { return this.prisma.menuCategoryDish.delete({ where: { categoryId_dishId: { categoryId, dishId } } }); }
  setDishActive(categoryId: string, dishId: string, isActive: boolean) { return this.prisma.menuCategoryDish.update({ where: { categoryId_dishId: { categoryId, dishId } }, data: { isActive } }); }
  async reorder(ids: string[]) {
    const existing = await this.prisma.menuCategory.findMany({ select: { id: true } });
    this.assertSame(existing.map((item) => item.id), ids);
    return this.prisma.$transaction(async (tx) => { await tx.menuCategory.updateMany({ data: { displayOrder: { increment: 100000 } } }); return Promise.all(ids.map((id, index) => tx.menuCategory.update({ where: { id }, data: { displayOrder: index } }))); });
  }
  async reorderDishes(categoryId: string, ids: string[]) {
    const existing = await this.prisma.menuCategoryDish.findMany({ where: { categoryId }, select: { dishId: true } });
    this.assertSame(existing.map((item) => item.dishId), ids);
    return this.prisma.$transaction(async (tx) => { await tx.menuCategoryDish.updateMany({ where: { categoryId }, data: { displayOrder: { increment: 100000 } } }); return Promise.all(ids.map((dishId, index) => tx.menuCategoryDish.update({ where: { categoryId_dishId: { categoryId, dishId } }, data: { displayOrder: index } }))); });
  }
  private assertSame(expected: string[], actual: string[]) { if (expected.length !== actual.length || expected.some((id) => !actual.includes(id))) throw new BadRequestException('Invalid ordering'); }
}
