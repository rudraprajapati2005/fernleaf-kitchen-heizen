import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { validateEnvironment } from './config/environment';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { StaffModule } from './modules/staff/staff.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MenuModule } from './modules/menu/menu.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        join(__dirname, '../.env.local'),
        join(__dirname, '../.env'),
        '.env.local',
        '.env',
      ],
      validate: validateEnvironment,
    }),
    AuthModule,
    AuthorizationModule,
    StaffModule,
    ReferenceDataModule,
    CatalogueModule,
    CategoriesModule,
    CompaniesModule,
    EmployeesModule,
    PricingModule,
    MenuModule,
    CalendarModule,
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
