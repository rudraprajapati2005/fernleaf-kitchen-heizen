import { Controller, ForbiddenException, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CapabilityGuard } from './capability.guard';
import { RequireCapabilities } from './require-capabilities.decorator';
import { AuthorizationService } from './authorization.service';

@Controller('authorization')
@UseGuards(AuthGuard, CapabilityGuard)
export class AuthorizationController {
  constructor(private readonly authorization: AuthorizationService) {}

  @Get('me')
  getMyCapabilities(@CurrentUser() user: AuthenticatedUser) {
    return { capabilities: this.authorization.getCapabilities(user.role) };
  }

  @Get('admin-settings')
  @RequireCapabilities('settings.manage')
  getAdminSettings() {
    return { status: 'authorized' };
  }

  @Get('kitchen-board')
  @RequireCapabilities('kitchen.read')
  getKitchenBoard() {
    return { status: 'authorized' };
  }

  @Get('dispatch-board')
  @RequireCapabilities('dispatch.read')
  getDispatchBoard() {
    return { status: 'authorized' };
  }

  @Get('driver-deliveries/:driverId')
  @RequireCapabilities('driver.read')
  getDriverDeliveries(@Param('driverId') driverId: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'DRIVER' && user.id !== driverId) {
      throw new ForbiddenException('Drivers may only access their own deliveries');
    }
    return { status: 'authorized', driverId };
  }
}
