import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferenceDataService } from '../reference-data/reference-data.service';
import type { CreateDishDto, CreateOptionDto } from './dto/catalogue.dto';

@Injectable()
export class CatalogueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly references: ReferenceDataService,
  ) {}

  createDish(dto: CreateDishDto) {
    return this.withValidatedReferences(dto, async () =>
      this.prisma.dish.create({
        data: {
          name: dto.name.trim(),
          ...(dto.description ? { description: dto.description.trim() } : {}),
          price: dto.price,
          ...(dto.kitchenStationId
            ? { kitchenStation: { connect: { id: dto.kitchenStationId } } }
            : {}),
          allergens: { connect: (dto.allergenIds ?? []).map((id) => ({ id })) },
          dietaryTags: { connect: (dto.dietaryTagIds ?? []).map((id) => ({ id })) },
        },
        include: { allergens: true, dietaryTags: true, kitchenStation: true },
      }),
    );
  }

  createOption(dto: CreateOptionDto) {
    return this.withValidatedReferences(dto, async () =>
      this.prisma.option.create({
        data: {
          name: dto.name.trim(),
          priceAdjustment: dto.priceAdjustment,
          allergens: { connect: (dto.allergenIds ?? []).map((id) => ({ id })) },
          dietaryTags: { connect: (dto.dietaryTagIds ?? []).map((id) => ({ id })) },
        },
        include: { allergens: true, dietaryTags: true },
      }),
    );
  }

  private async withValidatedReferences(
    dto: CreateDishDto | CreateOptionDto,
    action: () => Promise<unknown>,
  ) {
    await this.references.ensureActiveIds('allergens', dto.allergenIds ?? []);
    await this.references.ensureActiveIds('dietary-tags', dto.dietaryTagIds ?? []);
    if ('kitchenStationId' in dto && dto.kitchenStationId) {
      await this.references.ensureActiveIds('kitchen-stations', [dto.kitchenStationId]);
    }
    return action();
  }
}
