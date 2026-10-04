import { BadRequestException, ConflictException } from '@nestjs/common';
import { CategoriesService } from '../src/modules/categories/categories.service';

describe('CategoriesService', () => {
  const prisma = {
    menuCategory: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    dish: { findUnique: jest.fn() },
    menuCategoryDish: { create: jest.fn() },
  };
  const service = new CategoriesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects inactive dishes and duplicate category membership', async () => {
    prisma.menuCategory.findUnique.mockResolvedValue({ id: 'category_1' });
    prisma.dish.findUnique.mockResolvedValue({ id: 'dish_1', isActive: false });
    await expect(service.addDish('category_1', { dishId: 'dish_1', displayOrder: 0 })).rejects.toBeInstanceOf(BadRequestException);
    prisma.dish.findUnique.mockResolvedValue({ id: 'dish_1', isActive: true });
    prisma.menuCategoryDish.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.addDish('category_1', { dishId: 'dish_1', displayOrder: 0 })).rejects.toBeInstanceOf(ConflictException);
  });
});
