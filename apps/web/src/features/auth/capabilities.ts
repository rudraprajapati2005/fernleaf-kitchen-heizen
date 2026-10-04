import type { StaffRole } from './auth-types';

export const CAPABILITIES = [
  'catalogue.read',
  'catalogue.manage',
  'company.read',
  'company.manage',
  'employee.read',
  'employee.manage',
  'order.read',
  'order.create',
  'order.manage',
  'kitchen.read',
  'kitchen.manage',
  'dispatch.read',
  'dispatch.manage',
  'driver.read',
  'driver.manage',
  'billing.read',
  'billing.manage',
  'settings.manage',
  'staff.manage',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_CAPABILITIES: Readonly<Record<StaffRole, readonly Capability[]>> = {
  ADMIN: CAPABILITIES,
  KITCHEN: [
    'company.read',
    'employee.read',
    'order.read',
    'kitchen.read',
    'kitchen.manage',
    'catalogue.read',
  ],
  DISPATCH: [
    'company.read',
    'employee.read',
    'order.read',
    'dispatch.read',
    'dispatch.manage',
    'driver.read',
    'catalogue.read',
  ],
  DRIVER: ['order.read', 'driver.read', 'driver.manage'],
};

export function hasCapability(role: StaffRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
