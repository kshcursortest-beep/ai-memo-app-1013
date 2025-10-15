// components/notes/SummaryDisplay.tsx
// AI 요약 표시 컴포넌트
// 생성된 요약 내용을 시각적으로 표시하고 편집 기능 제공
// 관련 파일: app/notes/[id]/page.tsx, app/actions/summaries.ts, components/ui/inline-editor.tsx

'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils/dateFormat'
import { InlineEditor } from '@/components/ui/inline-editor'
import { updateSummary } from '@/app/actions/summaries'
import { toast } from 'sonner'

interface SummaryDisplayProps {
  noteId: string
  summary: {
    id: string
    content: string
    model: string
    createdAt: Date
  }
  showModel?: boolean
  onSummaryUpdated?: (summary: { id: string; content: string; model: string; createdAt: Date }) => void
}

/**
 * AI 요약 표시 컴포넌트
 * @param noteId - 노트 ID
 * @param summary - 요약 데이터 (id, content, model, createdAt)
 * @param showModel - AI 모델 정보 표시 여부 (기본값: false)
 * @param onSummaryUpdated - 요약 업데이트 콜백
 */
export function SummaryDisplay({ 
  noteId, 
  summary, 
  showModel = false, 
  onSummaryUpdated 
}: SummaryDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)

  // 요약 저장 처리
  const handleSave = async (newContent: string) => {
    const result = await updateSummary(noteId, newContent)
    
    if (result.success && result.summary) {
      toast.success('요약이 업데이트되었습니다.')
      onSummaryUpdated?.(result.summary)
      return { success: true }
    } else {
      toast.error(result.error || '요약 업데이트에 실패했습니다.')
      return { success: false, error: result.error }
    }
  }

  // 편집 취소 처리
  const handleCancel = () => {
    setIsEditing(false)
  }

  // 요약 내용을 줄바꿈 기준으로 분리
  const summaryLines = summary.content.split('\n').filter((line) => line.trim() !== '')

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <span>✨</span>
          <span>AI 요약</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600">
            {formatDate(summary.createdAt)}
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
              aria-label="요약 편집"
            >
              편집
            </button>
          )}
        </div>
      </div>

      {/* 요약 내용 */}
      {isEditing ? (
        <InlineEditor
          value={summary.content}
          onSave={handleSave}
          onCancel={handleCancel}
          placeholder="요약 내용을 입력하세요..."
          maxLength={2000}
          className="bg-white"
        />
      ) : (
        <div className="space-y-1.5">
          {summaryLines.map((line, index) => {
            // 불릿 포인트 제거 및 정리
            const cleanedLine = line.replace(/^[-*•]\s*/, '').trim()

            if (!cleanedLine) return null

            return (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                <p className="text-sm leading-relaxed text-blue-900">{cleanedLine}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* AI 모델 정보 (선택적) */}
      {showModel && (
        <div className="mt-3 border-t border-blue-200 pt-2">
          <p className="text-xs text-blue-600">모델: {summary.model}</p>
        </div>
      )}
    </div>
  )
}

