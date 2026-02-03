import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL geçerli bir URL olmalı'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Telegram Bot
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN gerekli'),
  BOT_USERNAME: z.string().default('FootballManagerBot'),

  // API Server
  API_PORT: z.coerce.number().default(3001),
  API_URL: z.string().default('http://localhost:3001'),

  // Web App
  WEB_PORT: z.coerce.number().default(3000),

  // Game Settings
  TIMEZONE: z.string().default('Europe/Istanbul'),
  MATCH_DURATION_SECONDS: z.coerce.number().default(60),
  TICKS_PER_MATCH: z.coerce.number().default(60),

  // JWT
  JWT_SECRET: z.string().min(10, 'JWT_SECRET en az 10 karakter olmalı'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    console.error('❌ Ortam değişkenleri doğrulaması başarısız:\n' + errorMessages);
    process.exit(1);
  }

  return parsed.data;
}

export const config = loadConfig();

export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
