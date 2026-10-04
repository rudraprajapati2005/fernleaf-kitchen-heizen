import { NotFoundException } from '@nestjs/common';
import { ReferenceDataService } from '../src/modules/reference-data/reference-data.service';

describe('ReferenceDataService', () => {
  const prisma = {
    allergen: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dietaryTag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    kitchenStation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new ReferenceDataService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates and deactivates an allergen without deleting it', async () => {
    prisma.allergen.create.mockResolvedValue({ id: 'a1', name: 'Peanut', isActive: true });
    prisma.allergen.findUnique.mockResolvedValue({ id: 'a1' });
    prisma.allergen.update.mockResolvedValue({ id: 'a1', name: 'Peanut', isActive: false });

    await service.create('allergens', { name: 'Peanut' });
    const result = await service.update('allergens', 'a1', { isActive: false });

    expect(result.isActive).toBe(false);
    expect(prisma.allergen.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { isActive: false },
    });
  });

  it('rejects inactive or missing association ids', async () => {
    prisma.dietaryTag.findMany.mockResolvedValue([]);

    await expect(service.ensureActiveIds('dietary-tags', ['missing'])).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
