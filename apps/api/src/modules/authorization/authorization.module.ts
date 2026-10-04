import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationController } from './authorization.controller';
import { CapabilityGuard } from './capability.guard';
import { AuthorizationService } from './authorization.service';

@Module({
  imports: [AuthModule],
  controllers: [AuthorizationController],
  providers: [AuthorizationService, CapabilityGuard],
  exports: [AuthorizationService, CapabilityGuard],
})
export class AuthorizationModule {}
