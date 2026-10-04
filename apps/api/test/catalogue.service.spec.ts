import { NotFoundException } from '@nestjs/common';
import { CatalogueService } from '../src/modules/catalogue/catalogue.service';

describe('CatalogueService reference associations', () => {
  const prisma = {
    dish: { create: jest.fn() },
    option: { create: jest.fn() },
  };
  const references = { ensureActiveIds: jest.fn().mockResolvedValue(undefined) };
  const service = new CatalogueService(prisma as never, references as never);

  beforeEach(() => jest.clearAllMocks());

  it('persists dish allergen, dietary tag, and kitchen station associations', async () => {
    prisma.dish.create.mockResolvedValue({ id: 'dish_1' });

    await service.createDish({
      name: 'Curry',
      price: '12.50',
      kitchenStationId: 'station_1',
      allergenIds: ['allergen_1'],
      dietaryTagIds: ['tag_1'],
    });

    expect(references.ensureActiveIds).toHaveBeenCalledWith('allergens', ['allergen_1']);
    expect(references.ensureActiveIds).toHaveBeenCalledWith('dietary-tags', ['tag_1']);
    expect(references.ensureActiveIds).toHaveBeenCalledWith('kitchen-stations', ['station_1']);
    expect(prisma.dish.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          allergens: { connect: [{ id: 'allergen_1' }] },
          dietaryTags: { connect: [{ id: 'tag_1' }] },
        }),
      }),
    );
  });

  it('validates option references before persistence', async () => {
    references.ensureActiveIds.mockRejectedValueOnce(new NotFoundException('inactive'));

    await expect(
      service.createOption({
        name: 'Extra sauce',
        priceAdjustment: '1.50',
        allergenIds: ['inactive'],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.option.create).not.toHaveBeenCalled();
  });
});
