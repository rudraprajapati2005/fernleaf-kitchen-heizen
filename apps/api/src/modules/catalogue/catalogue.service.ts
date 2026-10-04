import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferenceDataService } from '../reference-data/reference-data.service';
import type {
  CatalogueQueryDto,
  CreateDishDto,
  CreateOptionDto,
  UpdateDishDto,
  UpdateOptionDto,
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

  private throwDuplicateSku(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('A dish with this SKU already exists');
    }
  }
}
