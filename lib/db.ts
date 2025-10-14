// lib/db.ts
// Drizzle ORM 데이터베이스 클라이언트 초기화
// PostgreSQL 연결 및 쿼리 실행
// 관련 파일: drizzle/schema.ts, app/actions/onboarding.ts

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

// PostgreSQL 연결 클라이언트
const connectionString = process.env.DATABASE_URL!

// 서버리스 환경을 위한 연결 설정
const client = postgres(connectionString, {
  prepare: false,
})

// Drizzle 인스턴스
export const db = drizzle(client, { schema })


