// components/notes/SummaryGenerateButton.tsx
// AI 요약 생성 버튼 컴포넌트
// 사용자가 요약 생성을 요청하고 로딩/에러 상태를 표시
// 관련 파일: app/actions/summaries.ts, app/notes/[id]/page.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateSummary } from '@/app/actions/summaries'
import { Loader2, Sparkles } from 'lucide-react'

interface SummaryGenerateButtonProps {
  noteId: string
  hasExistingSummary: boolean
  onSuccess?: () => void
}

/**
 * AI 요약 생성 버튼 컴포넌트
 * @param noteId - 요약을 생성할 노트 ID
 * @param hasExistingSummary - 기존 요약 존재 여부
 * @param onSuccess - 요약 생성 성공 시 콜백 함수
 */
export function SummaryGenerateButton({
  noteId,
  hasExistingSummary,
  onSuccess,
}: SummaryGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateSummary = async () => {
    setIsGenerating(true)

    try {
      const result = await generateSummary(noteId)

      if (result.success) {
        toast.success(
          hasExistingSummary
            ? '요약이 업데이트되었습니다.'
            : '요약이 생성되었습니다.'
        )
        onSuccess?.()
      } else {
        toast.error(result.error || '요약 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('요약 생성 실패:', error)
      toast.error('요약 생성 중 문제가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleGenerateSummary}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>요약 생성 중...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>{hasExistingSummary ? 'AI 요약 재생성' : 'AI 요약 생성'}</span>
        </>
      )}
    </Button>
  )
}

