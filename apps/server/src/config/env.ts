import dotenv from 'dotenv';
import path from 'path';

// Try loading local .env first, then root .env if in monorepo
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

let databaseUrl = process.env.DATABASE_URL || '';

// Automatically enforce ?pgbouncer=true for Supabase transaction pooler to avoid Postgres Error 26000
if (
  databaseUrl &&
  (databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')) &&
  !databaseUrl.includes('pgbouncer=true')
) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl = `${databaseUrl}${separator}pgbouncer=true`;
  process.env.DATABASE_URL = databaseUrl;
}

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: databaseUrl,
  JWT_SECRET: process.env.JWT_SECRET || 'studyflow_default_secret_key_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'studyflow_cookie_secret',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
