// app/error.tsx
// Next.js 전역 에러 페이지
// 클라이언트 에러 캐치 및 fallback UI 제공
// 관련 파일: lib/utils/errorHandler.ts

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 프로덕션 환경에서는 에러 로깅 시스템으로 전송
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>오류가 발생했습니다</CardTitle>
          <CardDescription>
            문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-gray-100 p-3">
              <p className="text-xs text-gray-700">{error.message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} className="flex-1">
            다시 시도
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
            홈으로
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


