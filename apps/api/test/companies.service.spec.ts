import { BadRequestException } from '@nestjs/common';
import { CompaniesService } from '../src/modules/companies/companies.service';

describe('CompaniesService', () => {
  const prisma = {
    company: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    employee: { findUnique: jest.fn() },
    companyEmailDomain: { create: jest.fn() },
    companyDeliveryAddress: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
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

  it('validates the default driver, address and stores the default lead time', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company_1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'driver_1' });
    prisma.companyDeliveryAddress.findFirst.mockResolvedValue({ id: 'address_1' });
    prisma.company.update.mockResolvedValue({ id: 'company_1', kitchenDepartureLeadMinutes: 60 });
    await expect(service.updateDeliveryConfig('company_1', {
      defaultDeliveryTime: '12:30',
      kitchenDepartureLeadMinutes: 60,
      defaultPackaging: 'STANDARD',
      defaultDriverId: 'driver_1',
      defaultDeliveryAddressId: 'address_1',
    })).resolves.toEqual(expect.objectContaining({ kitchenDepartureLeadMinutes: 60 }));
  });

  it('rejects an invalid delivery time before persistence', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company_1' });
    await expect(service.updateDeliveryConfig('company_1', {
      defaultDeliveryTime: '25:99',
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
