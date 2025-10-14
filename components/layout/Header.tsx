// components/layout/Header.tsx
// 네비게이션 헤더 컴포넌트
// 로그인 상태 확인 및 로그아웃 버튼
// 관련 파일: app/layout.tsx, app/actions/auth.ts

'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null
  onSignOut: () => Promise<{ error?: string; success?: boolean }>
}

export function Header({ user, onSignOut }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const result = await onSignOut()
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('로그아웃되었습니다.')
        router.push('/login')
      }
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // 로그인하지 않은 경우 헤더 숨김
  if (!user) {
    return null
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* 로고 */}
        <div className="flex items-center space-x-4">
          <a href="/" className="text-xl font-bold text-gray-900">
            AI 메모장
          </a>
        </div>

        {/* 사용자 정보 및 로그아웃 버튼 */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            aria-label="로그아웃"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  )
}

