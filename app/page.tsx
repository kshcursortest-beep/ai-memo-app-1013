// app/page.tsx
// AI 메모장 메인 페이지
// 로그인 사용자 확인 및 온보딩 플로우 통합
// 관련 파일: components/onboarding/OnboardingModal.tsx, app/actions/onboarding.ts

import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/user'
import { getOnboardingStatus, completeOnboarding } from '@/app/actions/onboarding'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function Home() {
  const user = await getUser()

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    redirect('/login')
  }

  // 온보딩 상태 확인
  const { hasCompletedOnboarding } = await getOnboardingStatus()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">AI 메모장</h1>
          <p className="mt-2 text-gray-600">
            아이디어를 기록하고 AI로 정리하세요
          </p>
        </div>

        {!hasCompletedOnboarding && (
          <p className="text-center text-sm text-gray-500">
            온보딩을 완료하면 메모 작성 기능을 사용할 수 있습니다.
          </p>
        )}

        {hasCompletedOnboarding && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-lg text-gray-600">
              메모 작성 기능은 Epic 2에서 구현됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 온보딩 플로우 */}
      <OnboardingFlow />
    </div>
  )
}
