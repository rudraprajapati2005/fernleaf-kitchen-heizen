import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STAFF_ACCOUNTS: ReadonlyArray<{
  email: string;
  name: string;
  password: string;
  role: UserRole;
}> = [
  { email: 'admin@test.com', name: 'Admin', password: 'Test@1234', role: UserRole.ADMIN },
  { email: 'kitchen@test.com', name: 'Kitchen', password: 'Test@1234', role: UserRole.KITCHEN },
  { email: 'dispatch@test.com', name: 'Dispatch', password: 'Test@1234', role: UserRole.DISPATCH },
  { email: 'driver@test.com', name: 'Driver', password: 'Test@1234', role: UserRole.DRIVER },
];

export async function seedStaffUsers(): Promise<void> {
  for (const account of STAFF_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
        isActive: true,
      },
      update: {
        passwordHash,
        role: account.role,
        isActive: true,
      },
    });
    console.log(`Ensured staff account: ${account.email} (${account.role})`);
  }
}

async function main(): Promise<void> {
  await seedStaffUsers();
}

main()
  .catch((error: unknown) => {
    console.error('Staff seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
