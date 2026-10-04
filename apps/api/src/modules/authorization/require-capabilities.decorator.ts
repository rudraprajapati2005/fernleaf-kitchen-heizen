import { SetMetadata } from '@nestjs/common';
import type { Capability } from './capabilities';
import { REQUIRED_CAPABILITIES } from './authorization.constants';

export const RequireCapabilities = (...capabilities: Capability[]) =>
  SetMetadata(REQUIRED_CAPABILITIES, capabilities);
