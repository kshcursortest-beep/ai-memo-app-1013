// components/notes/SummaryGenerateButton.tsx
// AI 요약 생성 버튼 컴포넌트
// 사용자가 요약 생성을 요청하고 로딩/에러 상태를 표시하며 상태 콜백 제공
// 관련 파일: app/actions/summaries.ts, app/notes/[id]/page.tsx, lib/types/ai.ts

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateSummary } from '@/app/actions/summaries'
import { Loader2, Sparkles } from 'lucide-react'
import type { AIProgress, AIError } from '@/lib/types/ai'

interface SummaryGenerateButtonProps {
  noteId: string
  hasExistingSummary: boolean
  onSuccess?: () => void
  onStart?: () => void
  onProgress?: (progress: AIProgress) => void
  onError?: (error: AIError) => void
  disabled?: boolean
}

/**
 * AI 요약 생성 버튼 컴포넌트
 * @param noteId - 요약을 생성할 노트 ID
 * @param hasExistingSummary - 기존 요약 존재 여부
 * @param onSuccess - 요약 생성 성공 시 콜백 함수
 * @param onStart - 요약 생성 시작 시 콜백 함수
 * @param onProgress - 진행률 업데이트 시 콜백 함수
 * @param onError - 에러 발생 시 콜백 함수
 * @param disabled - 버튼 비활성화 여부
 */
export function SummaryGenerateButton({
  noteId,
  hasExistingSummary,
  onSuccess,
  onStart,
  onProgress,
  onError,
  disabled,
}: SummaryGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    onStart?.()

    try {
      // 진행률 업데이트 시뮬레이션
      onProgress?.({
        step: 'preparing',
        percentage: 20,
        message: '요약 생성을 준비하고 있습니다...',
        estimatedTime: 6,
      })

      await new Promise(resolve => setTimeout(resolve, 500)) // 시뮬레이션

      onProgress?.({
        step: 'generating',
        percentage: 60,
        message: 'AI가 내용을 분석하고 있습니다...',
        estimatedTime: 4,
      })

      const result = await generateSummary(noteId)

      onProgress?.({
        step: 'saving',
        percentage: 90,
        message: '결과를 저장하고 있습니다...',
        estimatedTime: 1,
      })

      if (result.success) {
        onProgress?.({
          step: 'complete',
          percentage: 100,
          message: '처리가 완료되었습니다.',
          estimatedTime: 0,
        })

        toast.success(
          hasExistingSummary
            ? '요약이 업데이트되었습니다.'
            : '요약이 생성되었습니다.'
        )
        onSuccess?.()
      } else {
        if (result.aiError) {
          onError?.(result.aiError)
        } else {
          toast.error(result.error || '요약 생성에 실패했습니다.')
        }
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
      disabled={disabled || isGenerating}
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

