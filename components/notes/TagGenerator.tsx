// components/notes/TagGenerator.tsx
// AI 태그 생성 컴포넌트
// 태그 생성 버튼과 로딩 상태, 에러 처리 기능 제공하며 상태 콜백 지원
// 관련 파일: app/actions/tags.ts, components/notes/TagDisplay.tsx, lib/types/ai.ts

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateTags } from '@/app/actions/tags'
import { Tag, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { AIProgress, AIError } from '@/lib/types/ai'

interface TagGeneratorProps {
  noteId: string
  onTagsGenerated?: (tags: string[]) => void
  onStart?: () => void
  onProgress?: (progress: AIProgress) => void
  onError?: (error: AIError) => void
  disabled?: boolean
  className?: string
}

export function TagGenerator({ 
  noteId, 
  onTagsGenerated,
  onStart,
  onProgress,
  onError,
  disabled,
  className = '' 
}: TagGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateTags = async () => {
    if (isGenerating || disabled) return

    setIsGenerating(true)
    onStart?.()

    try {
      // 진행률 업데이트 시뮬레이션
      onProgress?.({
        step: 'preparing',
        percentage: 20,
        message: '태그 생성을 준비하고 있습니다...',
        estimatedTime: 5,
      })

      await new Promise(resolve => setTimeout(resolve, 300)) // 시뮬레이션

      onProgress?.({
        step: 'generating',
        percentage: 60,
        message: 'AI가 내용을 분석하고 있습니다...',
        estimatedTime: 3,
      })

      const result = await generateTags(noteId)

      onProgress?.({
        step: 'saving',
        percentage: 90,
        message: '결과를 저장하고 있습니다...',
        estimatedTime: 1,
      })

      if (result.success && result.tags) {
        onProgress?.({
          step: 'complete',
          percentage: 100,
          message: '처리가 완료되었습니다.',
          estimatedTime: 0,
        })

        toast.success(`${result.tags.length}개의 태그가 생성되었습니다.`)
        onTagsGenerated?.(result.tags)
      } else {
        if (result.aiError) {
          onError?.(result.aiError)
        } else {
          toast.error(result.error || '태그 생성에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('태그 생성 에러:', error)
      toast.error('태그 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Tag className="h-4 w-4" />
          AI 태그 생성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGenerateTags}
          disabled={disabled || isGenerating}
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
              AI 태그 생성
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          노트 내용을 분석하여 관련 태그를 자동 생성합니다.
        </p>
      </CardContent>
    </Card>
  )
}
