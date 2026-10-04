import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
@Module({ imports: [AuthModule, AuthorizationModule], controllers: [CalendarController], providers: [CalendarService], exports: [CalendarService] })
export class CalendarModule {}
