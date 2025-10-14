// lib/hooks/useSession.ts
// 세션 상태 관리 훅
// Supabase Auth 세션 변경 감지 및 탭 간 동기화
// 관련 파일: lib/supabase/client.ts, components/layout/Header.tsx

'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 초기 세션 확인
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    initSession()

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 여러 탭 간 세션 동기화 (BroadcastChannel)
    const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('auth-sync')
      : null

    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data === 'session-changed') {
          // 다른 탭에서 세션이 변경되면 현재 탭도 업데이트
          initSession()
        }
      }
    }

    return () => {
      subscription.unsubscribe()
      syncChannel?.close()
    }
  }, [supabase.auth])

  return { user, loading }
}

