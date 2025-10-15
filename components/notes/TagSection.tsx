// components/notes/TagSection.tsx
// 노트 태그 섹션 컴포넌트
// 태그 표시와 생성 기능을 통합한 섹션이며 AI 처리 상태 표시
// 관련 파일: components/notes/TagDisplay.tsx, components/notes/TagGenerator.tsx, app/actions/tags.ts, components/ui/loading.tsx, components/ui/error.tsx

'use client'

import { useState } from 'react'
import { TagDisplay } from './TagDisplay'
import { TagGenerator } from './TagGenerator'
import { AILoading, LoadingOverlay } from '@/components/ui/loading'
import { AIErrorDisplay } from '@/components/ui/error'
import { AIStatusIndicator } from '@/components/ui/progress'
import { RegenerationDialog } from '@/components/ui/regeneration-dialog'
import { useRouter } from 'next/navigation'
import { canRegenerateAndRecord } from '@/app/actions/regenerations'
import { generateTags } from '@/app/actions/tags'
import { toast } from 'sonner'
import { AIErrorType } from '@/lib/types/ai'
import type { AIStatus, AIProgress, AIError } from '@/lib/types/ai'

interface TagSectionProps {
  noteId: string
  initialTags?: string[]
  className?: string
}

export function TagSection({ 
  noteId, 
  initialTags = [], 
  className = '' 
}: TagSectionProps) {
  const router = useRouter()
  const [tags, setTags] = useState<string[]>(initialTags)
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle')
  const [aiProgress, setAiProgress] = useState<AIProgress | undefined>()
  const [aiError, setAiError] = useState<AIError | undefined>()
  const [retryCount, setRetryCount] = useState(0)
  
  // 재생성 다이얼로그 상태
  const [isRegenerationDialogOpen, setIsRegenerationDialogOpen] = useState(false)
  const [regenerationCount, setRegenerationCount] = useState(0)
  const [regenerationLimit, setRegenerationLimit] = useState(10)

  const handleTagsGenerated = (newTags: string[]) => {
    setTags(newTags)
    setAiStatus('success')
    setTimeout(() => {
      setAiStatus('idle')
    }, 2000) // 성공 상태를 2초간 표시
  }

  // 태그 업데이트 처리
  const handleTagsUpdated = (updatedTags: string[]) => {
    setTags(updatedTags)
  }

  // 태그 생성 시작
  const handleGenerateStart = () => {
    setAiStatus('loading')
    setAiProgress({
      step: 'preparing',
      percentage: 10,
      message: '태그 생성을 준비하고 있습니다...',
      estimatedTime: 6,
    })
    setAiError(undefined)
  }

  // 태그 생성 진행률 업데이트
  const handleProgressUpdate = (progress: AIProgress) => {
    setAiProgress(progress)
  }

  // 태그 생성 실패
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

  // 태그 재생성 확인 다이얼로그 열기
  const handleRegenerateClick = async () => {
    try {
      const result = await canRegenerateAndRecord(noteId, 'tags')
      
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

  // 태그 재생성 실행
  const handleRegenerateConfirm = async () => {
    setIsRegenerationDialogOpen(false)
    
    try {
      setAiStatus('loading')
      setAiProgress({
        step: 'preparing',
        percentage: 10,
        message: '태그 재생성을 준비하고 있습니다...',
        estimatedTime: 6,
      })
      setAiError(undefined)

      // 진행률 시뮬레이션
      setTimeout(() => {
        setAiProgress({
          step: 'generating',
          percentage: 60,
          message: 'AI가 새로운 태그를 생성하고 있습니다...',
          estimatedTime: 3,
        })
      }, 500)

      const result = await generateTags(noteId)

      setTimeout(() => {
        setAiProgress({
          step: 'saving',
          percentage: 90,
          message: '새로운 태그를 저장하고 있습니다...',
          estimatedTime: 1,
        })
      }, 1500)

      if (result.success && result.tags) {
        setAiProgress({
          step: 'complete',
          percentage: 100,
          message: '태그 재생성이 완료되었습니다.',
          estimatedTime: 0,
        })
        
        setTimeout(() => {
          setTags(result.tags!)
          toast.success('태그가 성공적으로 재생성되었습니다.')
          router.refresh()
        }, 1000)
      } else {
        if (result.aiError) {
          setAiError(result.aiError)
        } else {
          toast.error(result.error || '태그 재생성에 실패했습니다.')
        }
        setAiStatus('error')
        setAiProgress(undefined)
      }
    } catch (error) {
      console.error('태그 재생성 실패:', error)
      setAiStatus('error')
      setAiError({
        type: AIErrorType.UNKNOWN_ERROR,
        message: '태그 재생성 중 오류가 발생했습니다.',
        originalError: error,
        action: 'retry',
      })
      setAiProgress(undefined)
    }
  }

  return (
    <div className={`space-y-4 relative ${className}`}>
      {/* AI 상태 표시 */}
      {aiStatus === 'loading' && aiProgress && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AILoading progress={aiProgress} />
        </div>
      )}

      {aiStatus === 'success' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AIStatusIndicator status="success" />
        </div>
      )}

      {aiStatus === 'error' && aiError && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AIErrorDisplay
            error={aiError}
            onRetry={handleRetry}
            retryCount={retryCount}
            maxRetries={3}
          />
        </div>
      )}

      {/* 태그 표시 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">태그</h3>
          {tags.length > 0 && (
            <button
              onClick={handleRegenerateClick}
              disabled={aiStatus === 'loading'}
              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              재생성
            </button>
          )}
        </div>
        <TagDisplay 
          noteId={noteId}
          tags={tags} 
          onTagsUpdated={handleTagsUpdated}
        />
      </div>
      
      {/* 태그 생성 */}
      <TagGenerator 
        noteId={noteId} 
        onTagsGenerated={handleTagsGenerated}
        onStart={handleGenerateStart}
        onProgress={handleProgressUpdate}
        onError={handleError}
        disabled={aiStatus === 'loading'}
      />

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
        type="tags"
        currentCount={regenerationCount}
        limit={regenerationLimit}
        isLoading={aiStatus === 'loading'}
      />
    </div>
  )
}
