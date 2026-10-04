import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { validateEnvironment } from './config/environment';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { StaffModule } from './modules/staff/staff.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnvironment,
    }),
    AuthModule,
    AuthorizationModule,
    StaffModule,
    ReferenceDataModule,
    CatalogueModule,
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
