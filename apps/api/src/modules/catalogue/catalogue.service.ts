import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferenceDataService } from '../reference-data/reference-data.service';
import type {
  CatalogueQueryDto,
  CreateDishDto,
  CreateOptionDto,
  UpdateDishDto,
  UpdateOptionDto,
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  ReorderDto,
  CreatePortionSizeDto,
  UpdateGroupPortionsDto,
  UpdateGroupOptionPortionsDto,
} from './dto/catalogue.dto';

const dishInclude = { allergens: true, dietaryTags: true, kitchenStation: true } as const;
const optionInclude = { allergens: true, dietaryTags: true } as const;

@Injectable()
export class CatalogueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly references: ReferenceDataService,
  ) {}

  async listDishes(query: CatalogueQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = {
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.temperature ? { temperature: query.temperature } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { sku: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.dish.findMany({ where, include: dishInclude, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.dish.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async listOptions(query: CatalogueQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = {
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.option.findMany({ where, include: optionInclude, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.option.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  createDish(dto: CreateDishDto) {
    return this.withValidatedReferences(dto, async () => {
      try {
        return await this.prisma.dish.create({ data: this.dishData(dto, 'create'), include: dishInclude });
      } catch (error) {
        this.throwDuplicateSku(error);
        throw error;
      }
    });
  }

  async updateDish(id: string, dto: UpdateDishDto) {
    await this.ensureDish(id);
    await this.withValidatedReferences(dto, async () => undefined);
    try {
      return await this.prisma.dish.update({ where: { id }, data: this.dishData(dto, 'update'), include: dishInclude });
    } catch (error) {
      this.throwDuplicateSku(error);
      throw error;
    }
  }

  async setDishActive(id: string, isActive: boolean) {
    await this.ensureDish(id);
    return this.prisma.dish.update({ where: { id }, data: { isActive }, include: dishInclude });
  }

  createOption(dto: CreateOptionDto) {
    return this.withValidatedReferences(dto, () =>
      this.prisma.option.create({ data: this.optionData(dto, 'create'), include: optionInclude }),
    );
  }

  async updateOption(id: string, dto: UpdateOptionDto) {
    await this.ensureOption(id);
    await this.withValidatedReferences(dto, async () => undefined);
    return this.prisma.option.update({ where: { id }, data: this.optionData(dto, 'update'), include: optionInclude });
  }

  async setOptionActive(id: string, isActive: boolean) {
    await this.ensureOption(id);
    return this.prisma.option.update({ where: { id }, data: { isActive }, include: optionInclude });
  }

  listDishGroups(dishId: string) {
    return this.prisma.optionGroup.findMany({
      where: { dishId },
      orderBy: { displayOrder: 'asc' },
      include: { options: { orderBy: { displayOrder: 'asc' }, include: { option: true, portions: true } }, portions: { orderBy: { displayOrder: 'asc' }, include: { portionSize: true } } },
    });
  }

  async createGroup(dishId: string, dto: CreateOptionGroupDto) {
    await this.ensureDish(dishId);
    this.assertUnique(dto.optionIds);
    await this.ensureActiveOptions(dto.optionIds);
    return this.prisma.optionGroup.create({
      data: {
        dishId, name: dto.name.trim(), isRequired: dto.isRequired, displayOrder: dto.displayOrder,
        usesPortions: dto.usesPortions ?? false,
        options: { create: dto.optionIds.map((optionId, index) => ({ optionId, displayOrder: index })) },
      },
      include: { options: { include: { option: true } } },
    });
  }

  async updateGroup(id: string, dto: UpdateOptionGroupDto) {
    const group = await this.ensureGroup(id);
    this.assertUnique(dto.optionIds);
    await this.ensureActiveOptions(dto.optionIds);
    return this.prisma.$transaction(async (tx) => {
      await tx.optionGroupOption.deleteMany({ where: { groupId: id } });
      return tx.optionGroup.update({
        where: { id },
        data: {
          name: dto.name.trim(), isRequired: dto.isRequired, displayOrder: dto.displayOrder,
          usesPortions: dto.usesPortions ?? group.usesPortions,
          options: { create: dto.optionIds.map((optionId, index) => ({ optionId, displayOrder: index })) },
        },
        include: { options: { include: { option: true } } },
      });
    });
  }

  async deleteGroup(id: string) {
    await this.ensureGroup(id);
    return this.prisma.optionGroup.delete({ where: { id } });
  }

  async reorderGroups(dishId: string, dto: ReorderDto) {
    const groups = await this.prisma.optionGroup.findMany({ where: { dishId }, select: { id: true } });
    this.assertSameIds(groups.map((group) => group.id), dto.ids);
    return this.prisma.$transaction(async (tx) => {
      await tx.optionGroup.updateMany({ where: { dishId }, data: { displayOrder: { increment: 100000 } } });
      return Promise.all(dto.ids.map((id, index) => tx.optionGroup.update({ where: { id }, data: { displayOrder: index } })));
    });
  }

  async reorderGroupOptions(groupId: string, dto: ReorderDto) {
    const options = await this.prisma.optionGroupOption.findMany({ where: { groupId }, select: { id: true, optionId: true } });
    this.assertSameIds(options.map((option) => option.optionId), dto.ids);
    return this.prisma.$transaction(async (tx) => {
      await tx.optionGroupOption.updateMany({ where: { groupId }, data: { displayOrder: { increment: 100000 } } });
      return Promise.all(dto.ids.map((optionId, index) => tx.optionGroupOption.update({ where: { groupId_optionId: { groupId, optionId } }, data: { displayOrder: index } })));
    });
  }

  createPortionSize(dto: CreatePortionSizeDto) {
    return this.prisma.portionSize.create({ data: { name: dto.name.trim() } });
  }

  listPortionSizes(activeOnly = true) {
    return this.prisma.portionSize.findMany({ where: activeOnly ? { isActive: true } : {}, orderBy: { name: 'asc' } });
  }

  setPortionSizeActive(id: string, isActive: boolean) {
    return this.prisma.portionSize.update({ where: { id }, data: { isActive } });
  }

  async configureGroupPortions(groupId: string, dto: UpdateGroupPortionsDto) {
    await this.ensureGroup(groupId);
    if (dto.portionSizeIds.length !== dto.extraCharges.length) throw new BadRequestException('Each portion size requires one extra charge');
    this.assertUnique(dto.portionSizeIds);
    if (!dto.usesPortions && dto.portionSizeIds.length) throw new BadRequestException('A group without portions cannot have portion sizes');
    const sizes = await this.prisma.portionSize.findMany({ where: { id: { in: dto.portionSizeIds }, isActive: true }, select: { id: true } });
    this.assertSameIds(sizes.map((size) => size.id), dto.portionSizeIds);
    return this.prisma.$transaction(async (tx) => {
      await tx.optionGroupPortion.deleteMany({ where: { groupId } });
      await tx.optionGroupOptionPortion.deleteMany({ where: { optionGroupOption: { groupId } } });
      const updated = await tx.optionGroup.update({
        where: { id: groupId },
        data: {
          usesPortions: dto.usesPortions,
          portions: { create: dto.portionSizeIds.map((portionSizeId, index) => ({ portionSize: { connect: { id: portionSizeId } }, displayOrder: index, extraCharge: dto.extraCharges[index]! })) },
        },
        include: { portions: { include: { portionSize: true } } },
      });
      if (dto.usesPortions && dto.portionSizeIds.length) {
        const links = await tx.optionGroupOption.findMany({ where: { groupId }, select: { id: true } });
        const portions = await tx.optionGroupPortion.findMany({ where: { groupId }, select: { id: true } });
        await tx.optionGroupOptionPortion.createMany({
          data: links.flatMap((link) => portions.map((portion) => ({ optionGroupOptionId: link.id, optionGroupPortionId: portion.id }))),
        });
      }
      return updated;
    });
  }

  async configureGroupOptionPortions(groupOptionId: string, dto: UpdateGroupOptionPortionsDto) {
    const link = await this.prisma.optionGroupOption.findUnique({ where: { id: groupOptionId }, include: { group: { include: { portions: true } } } });
    if (!link) throw new NotFoundException('Group option not found');
    if (!link.group.usesPortions) throw new BadRequestException('This group does not use portions');
    this.assertUnique(dto.portionSizeIds);
    const supported = link.group.portions.map((portion) => portion.portionSizeId);
    this.assertSameIds(supported, dto.portionSizeIds);
    return this.prisma.optionGroupOption.update({ where: { id: groupOptionId }, data: { portions: { create: dto.portionSizeIds.map((portionSizeId) => ({ optionGroupPortion: { connect: { groupId_portionSizeId: { groupId: link.groupId, portionSizeId } } } })) } }, include: { portions: true } });
  }

  calculatePortionCharge(extraCharge: string, optionCost: string): string {
    return (Number(extraCharge) + Number(optionCost)).toFixed(2);
  }

  validateOrderQuantity(minimumOrderQuantity: number | null, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1) throw new ConflictException('Quantity must be a positive integer');
    if (minimumOrderQuantity !== null && quantity < minimumOrderQuantity) {
      throw new ConflictException(`Minimum order quantity is ${minimumOrderQuantity}`);
    }
  }

  private dishData(dto: CreateDishDto | UpdateDishDto, mode: 'create' | 'update') {
    const costPrice = dto.costPrice ?? dto.price;
    if (!costPrice) throw new BadRequestException('Cost price is required');
    if (!dto.sku) throw new BadRequestException('SKU is required');
    if (!dto.temperature) throw new BadRequestException('Temperature is required');
    return {
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      image: dto.image?.trim() ?? null,
      sku: dto.sku.trim(),
      temperature: dto.temperature,
      costPrice,
      minimumOrderQuantity: dto.minimumOrderQuantity ?? null,
      ...('isActive' in dto && dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.kitchenStationId
        ? { kitchenStation: { connect: { id: dto.kitchenStationId } } }
        : { kitchenStation: { disconnect: true } }),
      allergens: { [mode === 'create' ? 'connect' : 'set']: (dto.allergenIds ?? []).map((id) => ({ id })) },
      dietaryTags: { [mode === 'create' ? 'connect' : 'set']: (dto.dietaryTagIds ?? []).map((id) => ({ id })) },
    };
  }

  private optionData(dto: CreateOptionDto | UpdateOptionDto, mode: 'create' | 'update') {
    const cost = dto.cost ?? dto.priceAdjustment;
    if (!cost) throw new BadRequestException('Cost is required');
    return {
      name: dto.name.trim(),
      cost,
      ...('isActive' in dto && dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      allergens: { [mode === 'create' ? 'connect' : 'set']: (dto.allergenIds ?? []).map((id) => ({ id })) },
      dietaryTags: { [mode === 'create' ? 'connect' : 'set']: (dto.dietaryTagIds ?? []).map((id) => ({ id })) },
    };
  }

  private async withValidatedReferences(dto: CreateDishDto | UpdateDishDto | CreateOptionDto | UpdateOptionDto, action: () => Promise<unknown>) {
    await this.references.ensureActiveIds('allergens', dto.allergenIds ?? []);
    await this.references.ensureActiveIds('dietary-tags', dto.dietaryTagIds ?? []);
    if ('kitchenStationId' in dto && dto.kitchenStationId) {
      await this.references.ensureActiveIds('kitchen-stations', [dto.kitchenStationId]);
    }
    return action();
  }

  private async ensureDish(id: string) {
    if (!(await this.prisma.dish.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Dish not found');
    }
  }

  private async ensureOption(id: string) {
    if (!(await this.prisma.option.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Option not found');
    }
  }

  private async ensureGroup(id: string) {
      const group = await this.prisma.optionGroup.findUnique({ where: { id } });
      if (!group) throw new NotFoundException('Option group not found');
      return group;
  }

    private async ensureActiveOptions(ids: string[]) {
      const options = await this.prisma.option.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true } });
      this.assertSameIds(options.map((option) => option.id), ids);
  }

    private assertUnique(ids: string[]) {
      if (new Set(ids).size !== ids.length) throw new ConflictException('Duplicate choices are not allowed');
  }

    private assertSameIds(expected: string[], actual: string[]) {
      if (expected.length !== actual.length || expected.some((id) => !actual.includes(id))) throw new BadRequestException('The supplied choices do not belong to this group');
  }

  private throwDuplicateSku(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('A dish with this SKU already exists');
    }
  }
}
