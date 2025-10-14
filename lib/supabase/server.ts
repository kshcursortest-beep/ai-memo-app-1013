// lib/supabase/server.ts
// 서버 사이드에서 사용할 Supabase 클라이언트 초기화
// Server Actions 및 API Routes에서 Supabase Auth 및 데이터베이스 작업을 위한 클라이언트 제공
// 관련 파일: lib/supabase/client.ts, app/actions/auth.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  )
}

