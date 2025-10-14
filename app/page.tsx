// app/page.tsx
// AI 메모장 메인 페이지
// 로그인 사용자 확인 및 온보딩 플로우 통합, 노트 목록 표시 및 정렬
// 관련 파일: components/onboarding/OnboardingModal.tsx, app/actions/onboarding.ts, app/actions/notes.ts

import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/user'
import { getOnboardingStatus } from '@/app/actions/onboarding'
import { getNotes } from '@/app/actions/notes'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { NoteList } from '@/components/notes/NoteList'
import { NotePagination } from '@/components/notes/NotePagination'
import { NoteSortSelectorWrapper } from '@/components/notes/NoteSortSelectorWrapper'
import { getSortOption } from '@/lib/types/notes'

interface HomeProps {
  searchParams: Promise<{ page?: string; sort?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await getUser()

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    redirect('/login')
  }

  // 온보딩 상태 확인
  const { hasCompletedOnboarding } = await getOnboardingStatus()

  // URL 쿼리 파라미터에서 페이지 번호 및 정렬 옵션 읽기
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const sort = getSortOption(params.sort)

  // 노트 목록 조회 (정렬 옵션 포함)
  const notesResult = hasCompletedOnboarding ? await getNotes(page, 10, sort) : null

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
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-lg text-gray-600">
              온보딩을 완료하면 노트 작성 기능을 사용할 수 있습니다.
            </p>
          </div>
        )}

        {/* 노트 목록 */}
        {hasCompletedOnboarding && notesResult?.success && (
          <>
            {/* 정렬 옵션 */}
            <div className="mb-6 flex justify-end">
              <NoteSortSelectorWrapper currentSort={sort} />
            </div>

            <NoteList notes={notesResult.data.notes} />
            
            <NotePagination
              currentPage={notesResult.data.page}
              totalPages={notesResult.data.totalPages}
              total={notesResult.data.total}
              currentSort={sort}
            />
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
      <OnboardingFlow />
    </div>
  )
}
