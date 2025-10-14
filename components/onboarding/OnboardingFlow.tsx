// components/onboarding/OnboardingFlow.tsx
// 온보딩 플로우 클라이언트 컴포넌트
// 온보딩 상태 확인 및 모달 표시
// 관련 파일: components/onboarding/OnboardingModal.tsx, app/actions/onboarding.ts

'use client'

import { useEffect, useState } from 'react'
import { OnboardingModal } from './OnboardingModal'
import { getOnboardingStatus, completeOnboarding } from '@/app/actions/onboarding'

export function OnboardingFlow() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const { hasCompletedOnboarding } = await getOnboardingStatus()
      setShowOnboarding(!hasCompletedOnboarding)
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    return await completeOnboarding()
  }

  const handleSkip = async () => {
    return await completeOnboarding()
  }

  if (isLoading) {
    return null
  }

  return (
    <OnboardingModal
      open={showOnboarding}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}


