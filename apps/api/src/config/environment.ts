import { URL } from 'node:url';

export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  WEB_ORIGIN: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

function requiredString(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const nodeEnv = config['NODE_ENV'] ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const port = Number(config['PORT'] ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const databaseUrl = requiredString(config, 'DATABASE_URL');
  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    if (parsedDatabaseUrl.protocol !== 'postgresql:' && parsedDatabaseUrl.protocol !== 'postgres:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }

  const webOrigin = requiredString(config, 'WEB_ORIGIN');
  const webOrigins = webOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (webOrigins.length === 0) {
    throw new Error('WEB_ORIGIN must contain at least one URL');
  }
  for (const origin of webOrigins) {
    try {
      const parsedOrigin = new URL(origin);
      if (!parsedOrigin.origin || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash) {
        throw new Error('invalid origin format');
      }
    } catch {
      throw new Error('WEB_ORIGIN must contain valid origin URLs separated by commas');
    }
  }

  const jwtSecret = requiredString(config, 'JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  const jwtExpiresIn = requiredString(config, 'JWT_EXPIRES_IN');

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    WEB_ORIGIN: webOrigin,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
  };
}
