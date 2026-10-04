import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}
  get(companyId: string) { return this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, workingDays: true, holidays: true } }); }
  async setWorkingDays(companyId: string, workingDays: number[]) {
    if (new Set(workingDays).size !== workingDays.length || workingDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new BadRequestException('Working days must be unique weekday numbers from 0 to 6');
    return this.prisma.company.update({ where: { id: companyId }, data: { workingDays } });
  }
  async addHoliday(companyId: string, body: { date: string; label?: string }) {
    const date = new Date(`${body.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid holiday date');
    return this.prisma.companyHoliday.create({ data: { companyId, date, label: body.label?.trim() ?? null } });
  }
  removeHoliday(id: string) { return this.prisma.companyHoliday.delete({ where: { id } }); }
  async canReceiveDelivery(companyId: string, dateInput: Date | string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { workingDays: true, holidays: { select: { date: true } } } });
    if (!company) throw new NotFoundException('Company not found');
    const date = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00.000Z`) : dateInput;
    const day = date.getUTCDay();
    const days = Array.isArray(company.workingDays) ? company.workingDays.map(Number) : [1, 2, 3, 4, 5];
    return days.includes(day) && !company.holidays.some((holiday) => holiday.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
  }
}
