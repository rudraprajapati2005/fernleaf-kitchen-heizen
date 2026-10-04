import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('API infrastructure', () => {
  let app: INestApplication;
  const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('starts the application', () => {
    expect(app).toBeDefined();
  });

  it('returns a healthy response when database connectivity succeeds', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toMatchObject({ status: 'ok', database: 'ok' });
    expect(queryRaw).toHaveBeenCalled();
  });

  it('returns a consistent validation response for invalid request data', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health?verbose=not-a-boolean')
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/health?verbose=not-a-boolean',
        error: expect.objectContaining({
          code: 'REQUEST_ERROR',
          message: expect.any(Array),
        }),
      }),
    );
  });

  it('reports database connectivity failures', async () => {
    queryRaw.mockRejectedValueOnce(new Error('database unavailable'));

    const response = await request(app.getHttpServer()).get('/api/health').expect(503);

    expect(response.body.error).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database connectivity check failed',
    });
  });
});
