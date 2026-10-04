import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService, private readonly pricing: PricingService) {}
  async resolveForEmployee(employeeId: string, includeSecret = false) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, include: { company: { include: { priceTier: true, hiddenCategories: true, hiddenDishes: true } } } });
    if (!employee) throw new NotFoundException('Employee not found');
    const tier = employee.company.priceTier ?? await this.prisma.priceTier.findFirst({ where: { isDefault: true, isActive: true } });
    if (!tier) return { tier: null, categories: [] };
    const hiddenCategories = new Set(employee.company.hiddenCategories.map((item) => item.categoryId));
    const hiddenDishes = new Set(employee.company.hiddenDishes.map((item) => item.dishId));
    const categories = await this.prisma.menuCategory.findMany({ where: { isActive: true, ...(includeSecret ? {} : { secret: false }), id: { notIn: [...hiddenCategories] } }, orderBy: { displayOrder: 'asc' }, include: { dishes: { where: { isActive: true, dish: { isActive: true, id: { notIn: [...hiddenDishes] } } }, orderBy: { displayOrder: 'asc' }, include: { dish: { include: { optionGroups: { orderBy: { displayOrder: 'asc' }, include: { options: { where: { option: { isActive: true } }, orderBy: { displayOrder: 'asc' }, include: { option: true } } } } } } } } } });
    const resolved = [];
    for (const category of categories) {
      const dishes = [];
      for (const membership of category.dishes) {
        const price = await this.pricing.resolveDishPrice(membership.dish.id, tier.id);
        if (price === null) continue;
        const groups = [];
        for (const group of membership.dish.optionGroups) {
          const options = [];
          for (const link of group.options) {
            const optionPrice = await this.pricing.resolveOptionPrice(link.option.id, tier.id);
            if (optionPrice !== null) options.push({ ...link.option, price: optionPrice });
          }
          groups.push({ ...group, options });
        }
        dishes.push({ ...membership.dish, price, optionGroups: groups });
      }
      if (dishes.length) resolved.push({ ...category, dishes });
    }
    return { tier, categories: resolved };
  }
}
