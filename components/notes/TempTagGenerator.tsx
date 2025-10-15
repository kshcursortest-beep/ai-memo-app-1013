// components/notes/TempTagGenerator.tsx
// 임시 태그 생성 컴포넌트 (노트 생성 전)
// 노트 내용을 기반으로 태그를 미리 생성하고 표시하며 AI 처리 상태 표시
// 관련 파일: app/actions/tags.ts, components/notes/TagDisplay.tsx, components/ui/loading.tsx, components/ui/error.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateTempTags } from '@/app/actions/tags'
import { Tag, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { AILoading, LoadingOverlay } from '@/components/ui/loading'
import { AIErrorDisplay } from '@/components/ui/error'
import { AIStatusIndicator } from '@/components/ui/progress'
import type { AIStatus, AIProgress, AIError } from '@/lib/types/ai'
import { AIErrorType } from '@/lib/types/ai'

interface TempTagGeneratorProps {
  content: string
  onTagsGenerated?: (tags: string[]) => void
  className?: string
}

export function TempTagGenerator({ 
  content, 
  onTagsGenerated, 
  className = '' 
}: TempTagGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTags, setGeneratedTags] = useState<string[]>([])
  const [showTags, setShowTags] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle')
  const [aiProgress, setAiProgress] = useState<AIProgress | undefined>()
  const [aiError, setAiError] = useState<AIError | undefined>()
  const [retryCount, setRetryCount] = useState(0)

  const handleGenerateTags = async () => {
    if (isGenerating || !content.trim()) return

    setIsGenerating(true)
    setAiStatus('loading')
    setAiProgress({
      step: 'preparing',
      percentage: 10,
      message: '태그 생성을 준비하고 있습니다...',
      estimatedTime: 5,
    })
    setAiError(undefined)

    try {
      // 진행률 업데이트 시뮬레이션
      setAiProgress({
        step: 'generating',
        percentage: 60,
        message: 'AI가 내용을 분석하고 있습니다...',
        estimatedTime: 3,
      })

      await new Promise(resolve => setTimeout(resolve, 300)) // 시뮬레이션

      const result = await generateTempTags(content)

      setAiProgress({
        step: 'saving',
        percentage: 90,
        message: '결과를 처리하고 있습니다...',
        estimatedTime: 1,
      })

      if (result.success && result.tags) {
        setAiProgress({
          step: 'complete',
          percentage: 100,
          message: '처리가 완료되었습니다.',
          estimatedTime: 0,
        })

        setGeneratedTags(result.tags)
        setShowTags(true)
        setAiStatus('success')
        toast.success(`${result.tags.length}개의 태그가 생성되었습니다.`)
        onTagsGenerated?.(result.tags)

        // 성공 상태를 잠깐 보여준 후 idle로 변경
        setTimeout(() => {
          setAiStatus('idle')
        }, 2000)
      } else {
        if (result.aiError) {
          setAiStatus('error')
          setAiError(result.aiError)
        } else {
          toast.error(result.error || '태그 생성에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('태그 생성 에러:', error)
      setAiStatus('error')
      setAiError({
        type: AIErrorType.UNKNOWN_ERROR,
        message: '태그 생성 중 오류가 발생했습니다.',
        originalError: error,
        action: 'retry',
      })
      toast.error('태그 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearTags = () => {
    setGeneratedTags([])
    setShowTags(false)
    onTagsGenerated?.([])
  }

  // 재시도
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setAiStatus('idle')
    setAiError(undefined)
  }

  const canGenerateTags = content.trim().length >= 50

  return (
    <Card className={`${className} relative`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Tag className="h-4 w-4" />
          AI 태그 미리보기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI 상태 표시 */}
        {aiStatus === 'loading' && aiProgress && (
          <AILoading progress={aiProgress} />
        )}

        {aiStatus === 'success' && (
          <AIStatusIndicator status="success" />
        )}

        {aiStatus === 'error' && aiError && (
          <AIErrorDisplay
            error={aiError}
            onRetry={handleRetry}
            retryCount={retryCount}
            maxRetries={3}
          />
        )}

        <Button
          onClick={handleGenerateTags}
          disabled={isGenerating || !canGenerateTags}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              태그 생성 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              AI 태그 미리보기
            </>
          )}
        </Button>
        
        {!canGenerateTags && (
          <p className="text-xs text-muted-foreground">
            최소 50자 이상 작성하면 태그를 생성할 수 있습니다.
          </p>
        )}

        {showTags && generatedTags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                생성된 태그 ({generatedTags.length}개)
              </p>
              <Button
                onClick={handleClearTags}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {generatedTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              노트를 저장하면 이 태그들이 함께 저장됩니다.
            </p>
          </div>
        )}

        {/* 로딩 오버레이 */}
        <LoadingOverlay
          isLoading={aiStatus === 'loading'}
          progress={aiProgress}
        />
      </CardContent>
    </Card>
  )
}
