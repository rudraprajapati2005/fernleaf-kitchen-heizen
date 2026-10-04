import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { CatalogueController } from './catalogue.controller';
import { CatalogueService } from './catalogue.service';

@Module({
  imports: [AuthModule, AuthorizationModule, ReferenceDataModule],
  controllers: [CatalogueController],
  providers: [CatalogueService],
})
export class CatalogueModule {}
