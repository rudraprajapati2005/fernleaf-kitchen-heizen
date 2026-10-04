import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config: Record<string, unknown>) => ({
        NODE_ENV: config['NODE_ENV'] ?? 'development',
        PORT: Number(config['PORT'] ?? 4000),
        DATABASE_URL: config['DATABASE_URL'],
        WEB_ORIGIN: config['WEB_ORIGIN'] ?? 'http://localhost:3000',
      }),
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
