// components/notes/SummarySection.tsx
// AI 요약 섹션 컴포넌트
// 요약 표시와 생성 버튼을 함께 관리
// 관련 파일: components/notes/SummaryDisplay.tsx, components/notes/SummaryGenerateButton.tsx

'use client'

import { useState } from 'react'
import { SummaryDisplay } from './SummaryDisplay'
import { SummaryGenerateButton } from './SummaryGenerateButton'
import { useRouter } from 'next/navigation'

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
  const [hasSummary] = useState(!!initialSummary)

  // 요약 생성 성공 시 페이지 새로고침
  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">AI 요약</h2>
        <SummaryGenerateButton
          noteId={noteId}
          hasExistingSummary={hasSummary}
          onSuccess={handleSuccess}
        />
      </div>

      {/* 요약 표시 또는 빈 상태 */}
      {initialSummary ? (
        <SummaryDisplay summary={initialSummary} />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            아직 요약이 생성되지 않았습니다.
            <br />
            <span className="text-xs text-gray-500">
              "AI 요약 생성" 버튼을 클릭하여 요약을 생성하세요.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

