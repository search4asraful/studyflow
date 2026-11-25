import { PrismaClient } from '@prisma/client';
import { env } from './env';

// For memory-constrained environments (<100MB RAM), bound the connection pool
function getDatasourceUrl(): string | undefined {
  if (!env.DATABASE_URL) return undefined;
  try {
    const url = new URL(env.DATABASE_URL);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '5');
    }
    return url.toString();
  } catch {
    return env.DATABASE_URL;
  }
}

export const prisma = new PrismaClient({
  datasources: env.DATABASE_URL
    ? {
        db: {
          url: getDatasourceUrl(),
        },
      }
    : undefined,
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
