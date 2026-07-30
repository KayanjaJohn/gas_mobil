import dotenv from 'dotenv';
import { z } from 'zod';

// Load the environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('8000'),
  
  // MySQL Database Config
  DATABASE_URL: z.string().url(), // e.g., mysql://user:pass@host:3306/db
  
  // CORS Origins
  CLIENT_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  AGENT_URL: z.string().url(),
  DRIVER_APP_URL: z.string().url(),
  
  // Third-Party Secrets
  STRIPE_SECRET_KEY: z.string().startsWith('sk_live_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  MTN_MOMO_API_USER: z.string(),
  MTN_MOMO_API_KEY: z.string(),
  MTN_MOMO_SUBSCRIPTION_KEY: z.string(),
  MTN_MOMO_BASE_URL: z.string().url(),
  MTN_MOMO_ENVIRONMENT: z.literal('production'),
  
  AIRTEL_MONEY_CLIENT_ID: z.string(),
  AIRTEL_MONEY_CLIENT_SECRET: z.string(),
  AIRTEL_MONEY_BASE_URL: z.string().url(),
  
  // Email & Utilities
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string().email(),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info']).default('warn'),
  
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string(),
});

// Parse and validate
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid production environment configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
