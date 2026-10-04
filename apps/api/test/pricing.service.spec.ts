import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PricingService } from '../src/modules/pricing/pricing.service';

describe('PricingService', () => {
  const prisma = {
    priceTier: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    dish: { findUnique: jest.fn() },
    option: { findUnique: jest.fn() },
    dishPrice: { upsert: jest.fn() },
    optionPrice: { upsert: jest.fn() },
    company: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new PricingService(prisma as never);
  beforeEach(() => jest.clearAllMocks());
  it('rounds multiplier prices up to five cents', () => {
    expect(service.roundUpFiveCents(new Prisma.Decimal('2.11').mul(new Prisma.Decimal('1')))).toBe('2.15');
  });
  it('rejects self-referencing tier derivation', async () => {
    await expect(service.updateTier('tier_1', { name: 'Self', derivationType: 'TIER_PERCENTAGE', sourceTierId: 'tier_1', percentage: '10' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
