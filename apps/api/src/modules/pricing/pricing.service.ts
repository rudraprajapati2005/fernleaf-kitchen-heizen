import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PriceDerivationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const D = Prisma.Decimal;
export type TierInput = { name: string; isDefault?: boolean; isActive?: boolean; derivationType?: PriceDerivationType; costMultiplier?: string; sourceTierId?: string; percentage?: string };

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}
  listTiers() { return this.prisma.priceTier.findMany({ orderBy: { name: 'asc' }, include: { sourceTier: true } }); }
  async createTier(input: TierInput) {
    this.validateDerivation(input);
    try {
      const tier = await this.prisma.priceTier.create({ data: this.tierData(input) });
      if (input.isDefault) await this.makeDefault(tier.id);
      return tier;
    } catch (error) { if (this.isUnique(error)) throw new ConflictException('Price tier name already exists'); throw error; }
  }
  async updateTier(id: string, input: TierInput) {
    this.validateDerivation(input, id);
    const tier = await this.prisma.priceTier.update({ where: { id }, data: this.tierData(input) });
    if (input.isDefault) await this.makeDefault(id);
    return tier;
  }
  async assignCompanyTier(companyId: string, tierId: string) {
    const tier = await this.prisma.priceTier.findFirst({ where: { id: tierId, isActive: true } });
    if (!tier) throw new NotFoundException('Active price tier not found');
    return this.prisma.company.update({ where: { id: companyId }, data: { priceTierId: tierId }, include: { priceTier: true } });
  }
  setDishPrice(dishId: string, tierId: string, price: string) { return this.prisma.dishPrice.upsert({ where: { dishId_tierId: { dishId, tierId } }, create: { dishId, tierId, price }, update: { price } }); }
  setOptionPrice(optionId: string, tierId: string, price: string) { return this.prisma.optionPrice.upsert({ where: { optionId_tierId: { optionId, tierId } }, create: { optionId, tierId, price }, update: { price } }); }
  async resolveDishPrice(dishId: string, tierId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId }, include: { prices: true } });
    if (!dish) return null;
    return this.resolveItemPrice(tierId, dish.costPrice, dish.prices);
  }
  async resolveOptionPrice(optionId: string, tierId: string) {
    const option = await this.prisma.option.findUnique({ where: { id: optionId }, include: { prices: true } });
    if (!option) return null;
    return this.resolveItemPrice(tierId, option.cost, option.prices);
  }
  roundUpFiveCents(value: Prisma.Decimal) { return value.mul(20).ceil().div(20).toFixed(2); }
  private async makeDefault(id: string) { await this.prisma.$transaction([this.prisma.priceTier.updateMany({ where: { id: { not: id } }, data: { isDefault: false } }), this.prisma.priceTier.update({ where: { id }, data: { isDefault: true } })]); }
  private tierData(input: TierInput) {
    return {
      name: input.name.trim(), isDefault: input.isDefault ?? false, isActive: input.isActive ?? true,
      ...(input.derivationType === undefined ? {} : { derivationType: input.derivationType }),
      ...(input.costMultiplier === undefined ? {} : { costMultiplier: input.costMultiplier }),
      ...(input.sourceTierId === undefined ? {} : { sourceTier: { connect: { id: input.sourceTierId } } }),
      ...(input.percentage === undefined ? {} : { percentage: input.percentage }),
    };
  }
  private validateDerivation(input: TierInput, id?: string) { if (input.derivationType === PriceDerivationType.COST_MULTIPLIER && (!input.costMultiplier || Number(input.costMultiplier) <= 0)) throw new BadRequestException('A positive multiplier is required'); if (input.derivationType === PriceDerivationType.TIER_PERCENTAGE && (!input.sourceTierId || input.sourceTierId === id || input.percentage === undefined)) throw new BadRequestException('A different source tier and percentage are required'); if (!input.derivationType && (input.sourceTierId || input.costMultiplier || input.percentage)) throw new BadRequestException('Invalid derivation configuration'); }
  private async derive(tier: { derivationType: PriceDerivationType | null; costMultiplier: Prisma.Decimal | null; percentage: Prisma.Decimal | null; sourceTierId: string | null }, cost: Prisma.Decimal, seen: Set<string>): Promise<string | null> {
    if (tier.derivationType === PriceDerivationType.COST_MULTIPLIER && tier.costMultiplier) return this.roundUpFiveCents(cost.mul(tier.costMultiplier));
    if (tier.derivationType === PriceDerivationType.TIER_PERCENTAGE && tier.sourceTierId && tier.percentage) {
      if (seen.has(tier.sourceTierId)) throw new BadRequestException('Circular price tier derivation');
      const source = await this.prisma.priceTier.findUnique({ where: { id: tier.sourceTierId } });
      if (!source) return null;
      seen.add(tier.sourceTierId);
      const base = await this.derive(source, cost, seen);
      return base === null ? null : this.roundUpFiveCents(new D(base).mul(new D(1).plus(tier.percentage.div(100))));
    }
    return null;
  }
    private async resolveItemPrice(tierId: string, cost: Prisma.Decimal, prices: Array<{ tierId: string; price: Prisma.Decimal }>) {
      const tiers = await this.prisma.priceTier.findMany({ where: { isActive: true } });
      const byId = new Map(tiers.map((tier) => [tier.id, tier]));
      const explicit = new Map(prices.map((price) => [price.tierId, price.price]));
      const resolve = (id: string, seen: Set<string>): string | null => {
        if (explicit.has(id)) return explicit.get(id)!.toFixed(2);
        const tier = byId.get(id);
        if (!tier || seen.has(id)) throw new BadRequestException('Invalid circular price derivation');
        seen.add(id);
        if (tier.derivationType === PriceDerivationType.COST_MULTIPLIER && tier.costMultiplier) return this.roundUpFiveCents(cost.mul(tier.costMultiplier));
        if (tier.derivationType === PriceDerivationType.TIER_PERCENTAGE && tier.sourceTierId && tier.percentage) {
          const base = resolve(tier.sourceTierId, seen);
          return base === null ? null : this.roundUpFiveCents(new D(base).mul(new D(1).plus(tier.percentage.div(100))));
        }
        return null;
      };
      return resolve(tierId, new Set());
    }
  private isUnique(error: unknown) { return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'; }
}
