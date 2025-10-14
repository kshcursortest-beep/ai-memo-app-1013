// components/notes/SummaryDisplay.tsx
// AI 요약 표시 컴포넌트
// 생성된 요약 내용을 시각적으로 표시
// 관련 파일: app/notes/[id]/page.tsx, app/actions/summaries.ts

'use client'

import { formatDate } from '@/lib/utils/dateFormat'

interface SummaryDisplayProps {
  summary: {
    content: string
    model: string
    createdAt: Date
  }
  showModel?: boolean
}

/**
 * AI 요약 표시 컴포넌트
 * @param summary - 요약 데이터 (content, model, createdAt)
 * @param showModel - AI 모델 정보 표시 여부 (기본값: false)
 */
export function SummaryDisplay({ summary, showModel = false }: SummaryDisplayProps) {
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
        <span className="text-xs text-blue-600">
          {formatDate(summary.createdAt)}
        </span>
      </div>

      {/* 요약 내용 (불릿 포인트) */}
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

      {/* AI 모델 정보 (선택적) */}
      {showModel && (
        <div className="mt-3 border-t border-blue-200 pt-2">
          <p className="text-xs text-blue-600">모델: {summary.model}</p>
        </div>
      )}
    </div>
  )
}

