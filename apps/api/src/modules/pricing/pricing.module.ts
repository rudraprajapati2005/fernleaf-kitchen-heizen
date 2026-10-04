import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({ imports: [AuthModule, AuthorizationModule], controllers: [PricingController], providers: [PricingService], exports: [PricingService] })
export class PricingModule {}
