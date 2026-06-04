import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamModule } from './team/team.module';
import { EventsModule } from './events/events.module';
import { FinesModule } from './fines/fines.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { StandingsModule } from './standings/standings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health.controller';
import { v4 as uuidv4 } from 'uuid';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TeamModule,
    EventsModule,
    FinesModule,
    PaymentsModule,
    ReportsModule,
    StandingsModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: any) => {
        req.correlationId = req.headers['x-correlation-id'] || uuidv4();
        res.setHeader('X-Correlation-Id', req.correlationId);
        next();
      })
      .forRoutes('*');
  }
}
