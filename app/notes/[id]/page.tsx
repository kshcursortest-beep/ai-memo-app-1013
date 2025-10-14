// app/notes/[id]/page.tsx
// 노트 상세 조회 및 편집 페이지
// 노트의 전체 내용을 표시하고 편집 기능 제공
// 관련 파일: app/actions/notes.ts, components/notes/NoteEditForm.tsx, components/notes/SummaryDisplay.tsx

import { getNoteById } from '@/app/actions/notes'
import { NoteEditForm } from '@/components/notes/NoteEditForm'
import { SummaryDisplay } from '@/components/notes/SummaryDisplay'
import { SummarySection } from '@/components/notes/SummarySection'
import { notFound } from 'next/navigation'

interface NoteDetailPageProps {
  params: {
    id: string
  }
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const result = await getNoteById(params.id)

  // 에러 처리: 노트 없음 또는 권한 없음
  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* 노트 편집 폼 */}
      <NoteEditForm note={result.data} />

      {/* AI 요약 섹션 */}
      <SummarySection
        noteId={result.data.id}
        initialSummary={result.data.summary}
      />
    </div>
  )
}

