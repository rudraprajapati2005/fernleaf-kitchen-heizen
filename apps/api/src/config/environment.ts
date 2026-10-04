import { URL } from 'node:url';

export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  WEB_ORIGIN: string;
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
  try {
    new URL(webOrigin);
  } catch {
    throw new Error('WEB_ORIGIN must be a valid URL');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    WEB_ORIGIN: webOrigin,
  };
}
