import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('API infrastructure', () => {
  let app: INestApplication;
  const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  const findUnique = jest.fn();
  const passwordHash = bcrypt.hashSync('correct-password', 4);
  const users = [
    { id: 'admin_1', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' as const },
    {
      id: 'kitchen_1',
      email: 'kitchen@example.com',
      name: 'Kitchen User',
      role: 'KITCHEN' as const,
    },
    {
      id: 'dispatch_1',
      email: 'dispatch@example.com',
      name: 'Dispatch User',
      role: 'DISPATCH' as const,
    },
    { id: 'driver_1', email: 'driver@example.com', name: 'Driver User', role: 'DRIVER' as const },
  ].map((staff) => ({ ...staff, passwordHash, isActive: true }));
  const user = users[0]!;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw, user: { findUnique } })
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
    findUnique.mockImplementation(({ where }: { where: { email?: string; id?: string } }) => {
      const found = users.find(
        (candidate) => candidate.email === where.email || candidate.id === where.id,
      );
      if (found) return found;
      return null;
    });
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

  it('logs in with valid staff credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'correct-password' })
      .expect(201);

    expect(response.body).toEqual({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie']?.[0]).toContain('fearleaf_access_token=');
  });

  it('rejects invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);

    expect(response.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    });
  });

  it('does not authenticate an inactive staff account', async () => {
    const original = user.isActive;
    user.isActive = false;
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'correct-password' })
      .expect(401);
    user.isActive = original;
  });

  it('rejects protected routes without authentication', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rejects invalid and expired tokens', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', 'fearleaf_access_token=not-a-token')
      .expect(401);

    const expiredToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: -1 },
    );
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `fearleaf_access_token=${expiredToken}`)
      .expect(401);
  });

  it.each(users)('maps $role to the expected capabilities', async (staff) => {
    const token = jwt.sign(
      { sub: staff.id, email: staff.email, role: staff.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' },
    );
    const response = await request(app.getHttpServer())
      .get('/api/authorization/me')
      .set('Cookie', `fearleaf_access_token=${token}`)
      .expect(200);

    expect(response.body.capabilities).toEqual(
      expect.arrayContaining(
        staff.role === 'ADMIN'
          ? ['settings.manage', 'catalogue.manage']
          : staff.role === 'KITCHEN'
            ? ['kitchen.manage', 'catalogue.read']
            : staff.role === 'DISPATCH'
              ? ['dispatch.manage', 'driver.read']
              : ['driver.manage'],
      ),
    );
  });

  it('prevents kitchen and dispatch staff from admin operations', async () => {
    for (const staff of users.filter(
      (candidate) => candidate.role === 'KITCHEN' || candidate.role === 'DISPATCH',
    )) {
      const token = jwt.sign(
        { sub: staff.id, email: staff.email, role: staff.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' },
      );
      const response = await request(app.getHttpServer())
        .get('/api/authorization/admin-settings')
        .set('Cookie', `fearleaf_access_token=${token}`)
        .expect(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    }
  });

  it('prevents a driver from accessing another driver data', async () => {
    const token = jwt.sign(
      { sub: 'driver_1', email: 'driver@example.com', role: 'DRIVER' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' },
    );
    const response = await request(app.getHttpServer())
      .get('/api/authorization/driver-deliveries/driver_2')
      .set('Cookie', `fearleaf_access_token=${token}`)
      .expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
