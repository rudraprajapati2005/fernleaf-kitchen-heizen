import { MenuService } from '../src/modules/menu/menu.service';
describe('MenuService', () => {
  it('uses the resolved company/default tier and omits missing-price dishes', async () => {
    const prisma = {
      employee: { findUnique: jest.fn().mockResolvedValue({ company: { priceTier: { id: 'tier_company' }, hiddenCategories: [], hiddenDishes: [] } }) },
      menuCategory: { findMany: jest.fn().mockResolvedValue([{ id: 'category', name: 'Bowls', dishes: [{ dish: { id: 'dish_1', optionGroups: [] } }] }]) },
      priceTier: { findFirst: jest.fn() },
    };
    const pricing = { resolveDishPrice: jest.fn().mockResolvedValue(null), resolveOptionPrice: jest.fn() };
    const service = new MenuService(prisma as never, pricing as never);
    await expect(service.resolveForEmployee('employee_1')).resolves.toEqual({ tier: { id: 'tier_company' }, categories: [] });
  });
});
