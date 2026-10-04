import { Injectable } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { capabilitiesForRole } from './capabilities';

@Injectable()
export class AuthorizationService {
  getCapabilities(role: UserRole) {
    return capabilitiesForRole(role);
  }
}
