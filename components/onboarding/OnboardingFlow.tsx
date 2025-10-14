// components/onboarding/OnboardingFlow.tsx
// 온보딩 플로우 클라이언트 컴포넌트
// 온보딩 상태 확인 및 모달 표시 (자동 + 수동 트리거 지원)
// 관련 파일: components/onboarding/OnboardingModal.tsx, app/actions/onboarding.ts

'use client'

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { OnboardingModal } from './OnboardingModal'
import { getOnboardingStatus, completeOnboarding } from '@/app/actions/onboarding'

export interface OnboardingFlowRef {
  showOnboarding: () => void
}

export const OnboardingFlow = forwardRef<OnboardingFlowRef>((props, ref) => {
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
    const result = await completeOnboarding()
    if (result.success) {
      setShowOnboarding(false)
    }
    return result
  }

  const handleSkip = async () => {
    const result = await completeOnboarding()
    if (result.success) {
      setShowOnboarding(false)
    }
    return result
  }

  const handleClose = () => {
    setShowOnboarding(false)
  }

  // 외부에서 온보딩 모달을 표시할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    showOnboarding: () => {
      setShowOnboarding(true)
    },
  }))

  if (isLoading) {
    return null
  }

  return (
    <OnboardingModal
      open={showOnboarding}
      onComplete={handleComplete}
      onSkip={handleSkip}
      onOpenChange={handleClose}
    />
  )
})

OnboardingFlow.displayName = 'OnboardingFlow'


