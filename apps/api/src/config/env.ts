import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables supplied by the hosting platform or local .env.
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(5000),

  // The managed MySQL connection URL is the source of truth in production.
  // Local development may continue using the individual DB_* variables.
  DATABASE_URL: z.string().url(),

  // CORS origins
  CLIENT_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  AGENT_URL: z.string().url(),
  DRIVER_APP_URL: z.string().url(),

  // Email (used for OTP and account notifications)
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),

  LOG_LEVEL: z.enum(['error', 'warn', 'info']).default('warn'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid production environment configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
