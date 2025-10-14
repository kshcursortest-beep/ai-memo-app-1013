// components/notes/NoteList.tsx
// 노트 목록 컴포넌트 (반응형 그리드 레이아웃)
// NoteCard 또는 EmptyState 표시
// 관련 파일: components/notes/NoteCard.tsx, components/notes/EmptyState.tsx, app/page.tsx

'use client'

import { NoteCard } from './NoteCard'
import { EmptyState } from './EmptyState'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
}

interface NoteListProps {
  notes: Note[]
  hasCompletedOnboarding?: boolean
  onShowOnboarding?: () => void
}

export function NoteList({ notes, hasCompletedOnboarding = true, onShowOnboarding }: NoteListProps) {
  // 노트가 없는 경우 빈 상태 UI 표시
  if (notes.length === 0) {
    return <EmptyState hasCompletedOnboarding={hasCompletedOnboarding} onShowOnboarding={onShowOnboarding} />
  }

  // 반응형 그리드 레이아웃
  // 모바일: 1열, 태블릿: 2열, 데스크톱: 3열
  return (
    <div
      className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="노트 목록"
    >
      {notes.map((note) => (
        <div key={note.id} role="listitem">
          <NoteCard
            id={note.id}
            title={note.title}
            content={note.content}
            createdAt={note.createdAt}
          />
        </div>
      ))}
    </div>
  )
}

