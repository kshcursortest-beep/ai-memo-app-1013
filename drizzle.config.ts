// drizzle.config.ts
// Drizzle Kit 설정 파일
// 마이그레이션 및 스키마 관리
// 관련 파일: drizzle/schema.ts, .env.local

import dotenv from 'dotenv'
dotenv.config({path: '.env.local'})

import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config

