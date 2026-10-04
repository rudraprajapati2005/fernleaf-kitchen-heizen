import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({ imports: [AuthModule, AuthorizationModule], controllers: [CompaniesController], providers: [CompaniesService] })
export class CompaniesModule {}
