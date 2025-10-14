// components/onboarding/OnboardingModal.tsx
// 신규 사용자 온보딩 모달 컴포넌트
// 3단계 온보딩 플로우 및 진행 상태 표시
// 관련 파일: app/actions/onboarding.ts, app/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface OnboardingModalProps {
  open: boolean
  onComplete: () => Promise<{ error?: string; success?: boolean }>
  onSkip: () => Promise<{ error?: string; success?: boolean }>
  onOpenChange?: (open: boolean) => void
}

const ONBOARDING_STEPS = [
  {
    title: 'AI 메모장에 오신 것을 환영합니다!',
    description:
      '아이디어를 쉽게 기록하고 정리하세요. AI가 여러분의 메모를 더욱 가치있게 만들어드립니다.',
    icon: '👋',
  },
  {
    title: '텍스트와 음성으로 메모하세요',
    description:
      '텍스트로 입력하거나, 음성으로 빠르게 메모를 작성할 수 있습니다. 언제 어디서나 편리하게 아이디어를 기록하세요.',
    icon: '✍️',
  },
  {
    title: 'AI가 자동으로 정리해드립니다',
    description:
      'AI가 자동으로 요약과 태그를 생성해 메모를 체계적으로 관리합니다. 검색과 분류가 더욱 쉬워집니다.',
    icon: '🤖',
  },
]

export function OnboardingModal({ open, onComplete, onSkip, onOpenChange }: OnboardingModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const result = await onComplete()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('온보딩을 완료했습니다!')
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      toast.error('온보딩 완료 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setIsLoading(true)
    try {
      const result = await onSkip()
      if (result.error) {
        toast.error(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      toast.error('건너뛰기 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const step = ONBOARDING_STEPS[currentStep]

  return (
    <Dialog open={open} onOpenChange={onOpenChange || (() => {})}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mb-4 text-center text-6xl">{step.icon}</div>
          <DialogTitle className="text-center text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* 진행 상태 표시 */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-xs text-gray-500">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          {/* 건너뛰기 버튼 (첫 단계에만 표시) */}
          {currentStep === 0 && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              건너뛰기
            </Button>
          )}

          {/* 이전 버튼 (첫 단계가 아닐 때) */}
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              이전
            </Button>
          )}

          {/* 다음/시작하기 버튼 */}
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? '처리 중...' : isLastStep ? '시작하기' : '다음'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


