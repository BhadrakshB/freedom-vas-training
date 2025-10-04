import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  out: './drizzle',
  schema: './src/app/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_NEON_DATABASE_URL!,
  },
});
