// app/page.tsx
// AI 메모장 메인 페이지
// 로그인 사용자 확인 및 온보딩 플로우 통합, 노트 목록 표시 및 정렬, 빈 상태 UI
// 관련 파일: components/onboarding/OnboardingModal.tsx, app/actions/onboarding.ts, app/actions/notes.ts

import { getUser } from '@/app/actions/user'
import { getOnboardingStatus } from '@/app/actions/onboarding'
import { getNotes } from '@/app/actions/notes'
import { getSortOption } from '@/lib/types/notes'
import { HomeClient } from './HomeClient'

interface HomeProps {
  searchParams: Promise<{ page?: string; sort?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await getUser()

  // 미들웨어에서 인증 처리를 하므로 여기서는 user가 항상 존재함
  if (!user) {
    // 이 경우는 발생하지 않아야 하지만 안전을 위해 처리
    return null
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
    <HomeClient 
      hasCompletedOnboarding={hasCompletedOnboarding}
      notesResult={notesResult}
      currentSort={sort}
      currentPage={page}
    />
  )
}
