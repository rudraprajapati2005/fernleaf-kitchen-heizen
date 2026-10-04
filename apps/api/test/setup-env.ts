process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/kitchen?schema=public';
process.env.WEB_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.JWT_EXPIRES_IN = '15m';
