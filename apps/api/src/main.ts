import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  const allowedOrigins = config
    .getOrThrow<string>('WEB_ORIGIN')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  const requestLoggingMiddleware = new RequestLoggingMiddleware();
  app.use((request: Request, response: Response, next: NextFunction) =>
    requestLoggingMiddleware.use(request, response, next),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('PORT'));
}

void bootstrap();
