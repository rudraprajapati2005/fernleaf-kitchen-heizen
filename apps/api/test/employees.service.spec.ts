import { NotFoundException } from '@nestjs/common';
import { EmployeesService } from '../src/modules/employees/employees.service';

describe('EmployeesService', () => {
  const prisma = {
    employee: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    company: { findUnique: jest.fn(), findFirst: jest.fn() },
    allergen: { findMany: jest.fn() },
    dietaryTag: { findMany: jest.fn() },
  };
  const service = new EmployeesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid companies', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    await expect(service.create({ name: 'Alex', companyId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists reassignment, preferences, and permission flags', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'employee_1', companyId: 'company_1' });
    prisma.company.findUnique.mockResolvedValue({ id: 'company_2', isActive: true });
    prisma.company.findFirst.mockResolvedValue(null);
    prisma.allergen.findMany.mockResolvedValue([{ id: 'allergen_1' }]);
    prisma.dietaryTag.findMany.mockResolvedValue([{ id: 'tag_1' }]);
    prisma.employee.update.mockResolvedValue({ id: 'employee_1' });

    await service.update('employee_1', {
      name: 'Alex',
      companyId: 'company_2',
      canChooseOwnDeliveryAddress: true,
      canChangeDeliveryTime: true,
      canChangePackaging: false,
      allergenIds: ['allergen_1'],
      dietaryPreferenceIds: ['tag_1'],
    });

    expect(prisma.employee.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        company: { connect: { id: 'company_2' } },
        canChooseOwnDeliveryAddress: true,
        canChangeDeliveryTime: true,
        canChangePackaging: false,
        allergies: { set: [{ id: 'allergen_1' }] },
        dietaryPreferences: { set: [{ id: 'tag_1' }] },
      }),
    }));
  });
});
