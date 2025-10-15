// components/notes/SummarySection.tsx
// AI 요약 섹션 컴포넌트
// 요약 표시와 생성 버튼을 함께 관리하며 AI 처리 상태 표시
// 관련 파일: components/notes/SummaryDisplay.tsx, components/notes/SummaryGenerateButton.tsx, components/ui/loading.tsx, components/ui/error.tsx

'use client'

import { useState } from 'react'
import { SummaryDisplay } from './SummaryDisplay'
import { SummaryGenerateButton } from './SummaryGenerateButton'
import { AILoading, LoadingOverlay } from '@/components/ui/loading'
import { AIErrorDisplay } from '@/components/ui/error'
import { AIStatusIndicator } from '@/components/ui/progress'
import { RegenerationDialog } from '@/components/ui/regeneration-dialog'
import { useRouter } from 'next/navigation'
import { canRegenerateAndRecord } from '@/app/actions/regenerations'
import { generateSummary } from '@/app/actions/summaries'
import { toast } from 'sonner'
import { AIErrorType } from '@/lib/types/ai'
import type { AIStatus, AIProgress, AIError } from '@/lib/types/ai'

interface SummarySectionProps {
  noteId: string
  initialSummary?: {
    id: string
    content: string
    model: string
    createdAt: Date
  } | null
}

/**
 * AI 요약 섹션 컴포넌트
 * @param noteId - 노트 ID
 * @param initialSummary - 초기 요약 데이터 (서버에서 전달)
 */
export function SummarySection({ noteId, initialSummary }: SummarySectionProps) {
  const router = useRouter()
  const [hasSummary, setHasSummary] = useState(!!initialSummary)
  const [currentSummary, setCurrentSummary] = useState(initialSummary)
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle')
  const [aiProgress, setAiProgress] = useState<AIProgress | undefined>()
  const [aiError, setAiError] = useState<AIError | undefined>()
  const [retryCount, setRetryCount] = useState(0)
  
  // 재생성 다이얼로그 상태
  const [isRegenerationDialogOpen, setIsRegenerationDialogOpen] = useState(false)
  const [regenerationCount, setRegenerationCount] = useState(0)
  const [regenerationLimit, setRegenerationLimit] = useState(10)

  // 요약 생성 성공 시 페이지 새로고침
  const handleSuccess = () => {
    setAiStatus('success')
    setHasSummary(true)
    setTimeout(() => {
      router.refresh()
    }, 1000) // 성공 상태를 잠깐 보여준 후 새로고침
  }

  // 요약 업데이트 처리
  const handleSummaryUpdated = (updatedSummary: { id: string; content: string; model: string; createdAt: Date }) => {
    setCurrentSummary(updatedSummary)
    setHasSummary(true)
  }

  // 요약 생성 시작
  const handleGenerateStart = () => {
    setAiStatus('loading')
    setAiProgress({
      step: 'preparing',
      percentage: 10,
      message: '요약 생성을 준비하고 있습니다...',
      estimatedTime: 8,
    })
    setAiError(undefined)
  }

  // 요약 생성 진행률 업데이트
  const handleProgressUpdate = (progress: AIProgress) => {
    setAiProgress(progress)
  }

  // 요약 생성 실패
  const handleError = (error: AIError) => {
    setAiStatus('error')
    setAiError(error)
    setAiProgress(undefined)
  }

  // 재시도
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setAiStatus('idle')
    setAiError(undefined)
  }

  // 요약 재생성 확인 다이얼로그 열기
  const handleRegenerateClick = async () => {
    try {
      const result = await canRegenerateAndRecord(noteId, 'summary')
      
      if (!result.canRegenerate) {
        toast.error(result.error || '재생성을 할 수 없습니다.')
        return
      }

      setRegenerationCount(result.currentCount || 0)
      setRegenerationLimit(result.limit || 10)
      setIsRegenerationDialogOpen(true)
    } catch (error) {
      console.error('재생성 확인 실패:', error)
      toast.error('재생성 확인 중 오류가 발생했습니다.')
    }
  }

  // 요약 재생성 실행
  const handleRegenerateConfirm = async () => {
    setIsRegenerationDialogOpen(false)
    
    try {
      setAiStatus('loading')
      setAiProgress({
        step: 'preparing',
        percentage: 10,
        message: '요약 재생성을 준비하고 있습니다...',
        estimatedTime: 8,
      })
      setAiError(undefined)

      // 진행률 시뮬레이션
      setTimeout(() => {
        setAiProgress({
          step: 'generating',
          percentage: 60,
          message: 'AI가 새로운 요약을 생성하고 있습니다...',
          estimatedTime: 4,
        })
      }, 500)

      const result = await generateSummary(noteId)

      setTimeout(() => {
        setAiProgress({
          step: 'saving',
          percentage: 90,
          message: '새로운 요약을 저장하고 있습니다...',
          estimatedTime: 1,
        })
      }, 2000)

      if (result.success) {
        setAiProgress({
          step: 'complete',
          percentage: 100,
          message: '요약 재생성이 완료되었습니다.',
          estimatedTime: 0,
        })
        
        setTimeout(() => {
          toast.success('요약이 성공적으로 재생성되었습니다.')
          router.refresh()
        }, 1000)
      } else {
        if (result.aiError) {
          setAiError(result.aiError)
        } else {
          toast.error(result.error || '요약 재생성에 실패했습니다.')
        }
        setAiStatus('error')
        setAiProgress(undefined)
      }
    } catch (error) {
      console.error('요약 재생성 실패:', error)
      setAiStatus('error')
      setAiError({
        type: AIErrorType.UNKNOWN_ERROR,
        message: '요약 재생성 중 오류가 발생했습니다.',
        originalError: error,
        action: 'retry',
      })
      setAiProgress(undefined)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 relative">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">AI 요약</h2>
        <div className="flex items-center gap-2">
          {hasSummary && (
            <button
              onClick={handleRegenerateClick}
              disabled={aiStatus === 'loading'}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              재생성
            </button>
          )}
          <SummaryGenerateButton
            noteId={noteId}
            hasExistingSummary={hasSummary}
            onSuccess={handleSuccess}
            onStart={handleGenerateStart}
            onProgress={handleProgressUpdate}
            onError={handleError}
            disabled={aiStatus === 'loading'}
          />
        </div>
      </div>

      {/* AI 상태 표시 */}
      {aiStatus === 'loading' && aiProgress && (
        <div className="mb-4">
          <AILoading progress={aiProgress} />
        </div>
      )}

      {aiStatus === 'success' && (
        <div className="mb-4">
          <AIStatusIndicator status="success" />
        </div>
      )}

      {aiStatus === 'error' && aiError && (
        <div className="mb-4">
          <AIErrorDisplay
            error={aiError}
            onRetry={handleRetry}
            retryCount={retryCount}
            maxRetries={3}
          />
        </div>
      )}

      {/* 요약 표시 또는 빈 상태 */}
      {currentSummary ? (
        <SummaryDisplay 
          noteId={noteId}
          summary={currentSummary} 
          onSummaryUpdated={handleSummaryUpdated}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            아직 요약이 생성되지 않았습니다.
            <br />
            <span className="text-xs text-gray-500">
              &quot;AI 요약 생성&quot; 버튼을 클릭하여 요약을 생성하세요.
            </span>
          </p>
        </div>
      )}

      {/* 로딩 오버레이 */}
      <LoadingOverlay
        isLoading={aiStatus === 'loading'}
        progress={aiProgress}
      />

      {/* 재생성 확인 다이얼로그 */}
      <RegenerationDialog
        isOpen={isRegenerationDialogOpen}
        onClose={() => setIsRegenerationDialogOpen(false)}
        onConfirm={handleRegenerateConfirm}
        type="summary"
        currentCount={regenerationCount}
        limit={regenerationLimit}
        isLoading={aiStatus === 'loading'}
      />
    </div>
  )
}

