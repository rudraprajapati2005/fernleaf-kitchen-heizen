import { ConflictException } from '@nestjs/common';
import { StaffService } from '../src/modules/staff/staff.service';

describe('StaffService', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new StaffService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a staff account with exactly one assigned role and never returns password data', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'staff_1',
      email: 'kitchen@example.com',
      name: 'Kitchen',
      role: 'KITCHEN',
      isActive: true,
    });

    const result = await service.create({
      email: 'Kitchen@example.com',
      name: 'Kitchen',
      password: 'password123',
      role: 'KITCHEN',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'kitchen@example.com', role: 'KITCHEN' }),
        select: expect.not.objectContaining({ passwordHash: true }),
      }),
    );
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('updates role and activation state', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'staff_1' });
    prisma.user.update.mockResolvedValue({ id: 'staff_1', role: 'DRIVER', isActive: false });

    await service.update('staff_1', { role: 'DRIVER', isActive: false });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: 'DRIVER', isActive: false } }),
    );
  });

  it('surfaces duplicate emails as a conflict', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({
        email: 'duplicate@example.com',
        name: 'Duplicate',
        password: 'password123',
        role: 'ADMIN',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
