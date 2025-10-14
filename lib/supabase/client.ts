// lib/supabase/client.ts
// 클라이언트 사이드에서 사용할 Supabase 클라이언트 초기화
// 브라우저 환경에서 Supabase Auth 및 데이터베이스 작업을 위한 클라이언트 제공
// 관련 파일: lib/supabase/server.ts, app/actions/auth.ts, components/auth/SignUpForm.tsx

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

