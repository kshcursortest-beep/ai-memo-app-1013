// app/HomeClient.tsx
// 메인 페이지 클라이언트 컴포넌트
// 온보딩 플로우 및 노트 목록 표시 (빈 상태 UI 연동)
// 관련 파일: app/page.tsx, components/onboarding/OnboardingFlow.tsx, components/notes/NoteList.tsx

'use client'

import { useRef } from 'react'
import { OnboardingFlow, OnboardingFlowRef } from '@/components/onboarding/OnboardingFlow'
import { NoteList } from '@/components/notes/NoteList'
import { NotePagination } from '@/components/notes/NotePagination'
import { NoteSortSelectorWrapper } from '@/components/notes/NoteSortSelectorWrapper'
import { SortOption } from '@/lib/types/notes'
import { Button } from '@/components/ui/button'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
}

interface NotesResult {
  success: boolean
  error?: string
  data: {
    notes: Note[]
    page: number
    totalPages: number
    total: number
  }
}

interface HomeClientProps {
  hasCompletedOnboarding: boolean
  notesResult: NotesResult | null
  currentSort: SortOption
  currentPage: number
}

export function HomeClient({
  hasCompletedOnboarding,
  notesResult,
  currentSort,
  currentPage,
}: HomeClientProps) {
  const onboardingFlowRef = useRef<OnboardingFlowRef>(null)

  const handleShowOnboarding = () => {
    onboardingFlowRef.current?.showOnboarding()
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">내 노트</h1>
          <p className="mt-2 text-gray-600">
            아이디어와 정보를 기록하고 관리하세요
          </p>
        </div>

        {/* 온보딩 미완료 상태 */}
        {!hasCompletedOnboarding && (
          <div className="rounded-lg border bg-card p-8 text-center space-y-4">
            <p className="text-lg text-gray-600">
              온보딩을 완료하면 노트 작성 기능을 사용할 수 있습니다.
            </p>
            <Button onClick={handleShowOnboarding} size="lg">
              시작하기
            </Button>
          </div>
        )}

        {/* 노트 목록 */}
        {hasCompletedOnboarding && notesResult?.success && (
          <>
            {/* 정렬 옵션 */}
            {notesResult.data.notes.length > 0 && (
              <div className="mb-6 flex justify-end">
                <NoteSortSelectorWrapper currentSort={currentSort} />
              </div>
            )}

            <NoteList 
              notes={notesResult.data.notes} 
              hasCompletedOnboarding={hasCompletedOnboarding}
              onShowOnboarding={handleShowOnboarding}
            />

            {notesResult.data.notes.length > 0 && (
              <NotePagination
                currentPage={currentPage}
                totalPages={notesResult.data.totalPages}
                total={notesResult.data.total}
                currentSort={currentSort}
              />
            )}
          </>
        )}

        {/* 에러 상태 */}
        {hasCompletedOnboarding && !notesResult?.success && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-lg text-red-600">
              {notesResult?.error || '노트 목록을 불러올 수 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 온보딩 플로우 */}
      <OnboardingFlow ref={onboardingFlowRef} />
    </div>
  )
}

