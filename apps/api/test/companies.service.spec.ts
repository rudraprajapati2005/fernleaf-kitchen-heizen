import { BadRequestException } from '@nestjs/common';
import { CompaniesService } from '../src/modules/companies/companies.service';

describe('CompaniesService', () => {
  const prisma = {
    company: { create: jest.fn(), update: jest.fn() },
    employee: { findUnique: jest.fn() },
    companyEmailDomain: { create: jest.fn() },
    companyDeliveryAddress: { findFirst: jest.fn() },
  };
  const service = new CompaniesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects public domains', async () => {
    await expect(service.addDomain('company_1', 'gmail.com')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires an owner employee from the same company', async () => {
    prisma.company.create.mockResolvedValue({ id: 'company_1' });
    prisma.employee.findUnique.mockResolvedValue({ companyId: 'other_company' });
    await expect(service.create({ name: 'Acme', ownerEmployeeId: 'employee_1' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an immutable snapshot of an active company address', async () => {
    prisma.companyDeliveryAddress.findFirst.mockResolvedValue({ label: 'HQ', addressLine1: '1 Main', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US', addressLine2: null });
    await expect(service.addressSnapshot('company_1', 'address_1')).resolves.toEqual(expect.objectContaining({ label: 'HQ', addressLine1: '1 Main' }));
  });
});
