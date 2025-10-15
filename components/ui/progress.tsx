// components/ui/progress.tsx
// AI 처리 진행률 표시 UI 컴포넌트
// 단계별 진행률, 예상 소요 시간, 처리 단계 표시
// 관련 파일: lib/types/ai.ts, components/ui/progress.tsx

'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, Circle, Clock, Sparkles } from 'lucide-react'
import type { AIProgress, AIProcessStep } from '@/lib/types/ai'

// 간단한 Progress 컴포넌트
interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('w-full bg-secondary rounded-full h-2', className)}>
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

interface StepIndicatorProps {
  step: AIProcessStep
  isCompleted: boolean
  isCurrent: boolean
  className?: string
}

export function StepIndicator({ 
  step, 
  isCompleted, 
  isCurrent, 
  className 
}: StepIndicatorProps) {
  const stepLabels = {
    preparing: '준비',
    generating: '생성',
    saving: '저장',
    complete: '완료',
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {isCompleted ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : isCurrent ? (
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      
      <span className={cn(
        'text-xs font-medium',
        isCompleted ? 'text-green-600' : 
        isCurrent ? 'text-primary' : 
        'text-muted-foreground'
      )}>
        {stepLabels[step]}
      </span>
    </div>
  )
}

interface AIProgressBarProps {
  progress: AIProgress
  showSteps?: boolean
  showTimeEstimate?: boolean
  className?: string
}

export function AIProgressBar({
  progress,
  showSteps = true,
  showTimeEstimate = true,
  className,
}: AIProgressBarProps) {
  const { step, percentage, message, estimatedTime } = progress
  
  const steps: AIProcessStep[] = ['preparing', 'generating', 'saving', 'complete']
  const currentStepIndex = steps.indexOf(step)
  
  const formatTime = (seconds?: number) => {
    if (!seconds) return ''
    if (seconds < 60) return `${Math.round(seconds)}초`
    return `${Math.round(seconds / 60)}분`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 진행률 바 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">
            {message}
          </span>
          <span className="text-sm text-muted-foreground">
            {percentage}%
          </span>
        </div>
        
        <Progress value={percentage} className="h-2" />
      </div>

      {/* 단계 표시 */}
      {showSteps && (
        <div className="flex justify-between items-center">
          {steps.map((stepName, index) => (
            <StepIndicator
              key={stepName}
              step={stepName}
              isCompleted={index < currentStepIndex}
              isCurrent={index === currentStepIndex}
            />
          ))}
        </div>
      )}

      {/* 예상 소요 시간 */}
      {showTimeEstimate && estimatedTime && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>예상 소요 시간: {formatTime(estimatedTime)}</span>
        </div>
      )}
    </div>
  )
}

interface AIStatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  progress?: AIProgress
  className?: string
}

export function AIStatusIndicator({
  status,
  progress,
  className,
}: AIStatusIndicatorProps) {
  if (status === 'idle') {
    return null
  }

  if (status === 'loading' && progress) {
    return (
      <div className={cn('p-4 bg-muted/50 rounded-lg', className)}>
        <AIProgressBar progress={progress} />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className={cn('flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg', className)}>
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-sm font-medium text-green-700">
          AI 처리가 완료되었습니다
        </span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={cn('flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg', className)}>
        <Circle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-medium text-red-700">
          AI 처리 중 오류가 발생했습니다
        </span>
      </div>
    )
  }

  return null
}

interface ProcessingTimeEstimateProps {
  startTime: number
  currentStep: AIProcessStep
  className?: string
}

export function ProcessingTimeEstimate({
  startTime,
  currentStep,
  className,
}: ProcessingTimeEstimateProps) {
  const elapsed = (Date.now() - startTime) / 1000
  
  // 단계별 예상 소요 시간 (초)
  const stepEstimates = {
    preparing: 2,
    generating: 8,
    saving: 1,
    complete: 0,
  }
  
  const steps: AIProcessStep[] = ['preparing', 'generating', 'saving', 'complete']
  const currentStepIndex = steps.indexOf(currentStep)
  
  let estimatedTotal = 0
  for (let i = 0; i <= currentStepIndex; i++) {
    estimatedTotal += stepEstimates[steps[i]]
  }
  
  const remaining = Math.max(0, estimatedTotal - elapsed)
  
  if (remaining <= 0) return null
  
  return (
    <div className={cn('flex items-center space-x-2 text-xs text-muted-foreground', className)}>
      <Clock className="h-3 w-3" />
      <span>예상 남은 시간: {Math.round(remaining)}초</span>
    </div>
  )
}