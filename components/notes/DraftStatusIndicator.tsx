// components/notes/DraftStatusIndicator.tsx
// 임시 저장 상태 표시 컴포넌트
// 임시 저장 상태(저장 중, 저장됨)를 시각적으로 표시
// 관련 파일: app/notes/new/page.tsx, lib/types/draft.ts

'use client'

import { DraftStatus } from '@/lib/types/draft'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DraftStatusIndicatorProps {
  status: DraftStatus
}

export function DraftStatusIndicator({ status }: DraftStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (status === 'saving' || status === 'saved') {
      setIsVisible(true)
    } else {
      // idle 상태면 숨김
      setIsVisible(false)
    }
  }, [status])

  useEffect(() => {
    // saved 상태면 2초 후 자동으로 숨김
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" aria-hidden="true" />
          <span className="text-gray-600">임시 저장 중...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          <span className="text-green-600">임시 저장됨</span>
        </>
      )}
    </div>
  )
}

