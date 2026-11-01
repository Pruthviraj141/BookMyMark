import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_PATH: z.string().default('./data/savr.db'),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
  JWT_SECRET: z.string().default('mybookmark_jwt_secret_dev_key_2026')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation error:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
