export type StaffRole = 'ADMIN' | 'KITCHEN' | 'DISPATCH' | 'DRIVER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  capabilities?: readonly string[];
}
