import { BadRequestException, ConflictException } from '@nestjs/common';
import { CatalogueService } from '../src/modules/catalogue/catalogue.service';

describe('Catalogue option groups and portions', () => {
  const prisma = {
    dish: { findUnique: jest.fn() },
    option: { findMany: jest.fn() },
    optionGroup: { create: jest.fn(), findUnique: jest.fn() },
    portionSize: { findMany: jest.fn() },
  };
  const references = { ensureActiveIds: jest.fn() };
  const service = new CatalogueService(prisma as never, references as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate choices and inactive options', async () => {
    prisma.dish.findUnique.mockResolvedValue({ id: 'dish_1' });
    await expect(service.createGroup('dish_1', {
      name: 'Protein', isRequired: true, displayOrder: 0, optionIds: ['option_1', 'option_1'],
    })).rejects.toBeInstanceOf(ConflictException);

    prisma.option.findMany.mockResolvedValue([]);
    await expect(service.createGroup('dish_1', {
      name: 'Protein', isRequired: true, displayOrder: 0, optionIds: ['inactive'],
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calculates an option price plus the selected portion charge', () => {
    expect(service.calculatePortionCharge('2.50', '10.00')).toBe('12.50');
  });

  it('rejects inactive portion sizes when configuring a group', async () => {
    prisma.optionGroup.findUnique.mockResolvedValue({ id: 'group_1', usesPortions: false });
    prisma.portionSize.findMany.mockResolvedValue([]);
    await expect(service.configureGroupPortions('group_1', {
      usesPortions: true, portionSizeIds: ['inactive'], extraCharges: ['2.00'],
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
