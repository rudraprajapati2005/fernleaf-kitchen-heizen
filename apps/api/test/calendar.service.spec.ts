import { CalendarService } from '../src/modules/calendar/calendar.service';
describe('CalendarService', () => {
  const prisma = { company: { findUnique: jest.fn(), update: jest.fn() }, companyHoliday: { create: jest.fn(), delete: jest.fn() } };
  const service = new CalendarService(prisma as never);
  it('blocks weekends and holidays but allows custom working days', async () => {
    prisma.company.findUnique.mockResolvedValue({ workingDays: [0], holidays: [{ date: new Date('2026-10-04T00:00:00Z') }] });
    await expect(service.canReceiveDelivery('company_1', '2026-10-11')).resolves.toBe(true);
    await expect(service.canReceiveDelivery('company_1', '2026-10-04')).resolves.toBe(false);
  });
});
