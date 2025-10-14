// app/actions/user.ts
// 사용자 정보 관련 Server Actions
// 현재 로그인한 사용자 정보 가져오기
// 관련 파일: lib/supabase/server.ts, components/layout/Header.tsx

'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 현재 로그인한 사용자 정보 가져오기 (단순화 버전)
 */
export async function getUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

