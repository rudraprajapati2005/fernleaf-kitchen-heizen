import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PricingModule } from '../pricing/pricing.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
@Module({ imports: [AuthModule, AuthorizationModule, PricingModule], controllers: [MenuController], providers: [MenuService], exports: [MenuService] })
export class MenuModule {}
