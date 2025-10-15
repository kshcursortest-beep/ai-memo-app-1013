// components/ui/loading.tsx
// AI 처리 로딩 상태 UI 컴포넌트
// 로딩 스피너, 프로그레스 바, 로딩 메시지 표시
// 관련 파일: lib/types/ai.ts, components/ui/progress.tsx

'use client'

import { cn } from '@/lib/utils'
import { Loader2, Sparkles } from 'lucide-react'
import type { AIProgress } from '@/lib/types/ai'

// 간단한 Progress 컴포넌트
interface ProgressProps {
  value: number
  className?: string
}

function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('w-full bg-secondary rounded-full h-2', className)}>
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="로딩 중"
    />
  )
}

interface AILoadingProps {
  progress?: AIProgress
  message?: string
  showProgress?: boolean
  className?: string
}

export function AILoading({ 
  progress, 
  message, 
  showProgress = true,
  className 
}: AILoadingProps) {
  const displayMessage = message || progress?.message || 'AI가 처리 중입니다...'
  const percentage = progress?.percentage || 0

  return (
    <div className={cn('flex flex-col items-center space-y-3', className)}>
      <div className="flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <LoadingSpinner size="sm" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {displayMessage}
        </p>
        
        {showProgress && (
          <div className="w-48 space-y-1">
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {percentage}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function LoadingButton({
  isLoading,
  loadingText = '처리 중...',
  children,
  disabled,
  className,
  onClick,
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-md',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  progress?: AIProgress
  className?: string
}

export function LoadingOverlay({
  isLoading,
  message,
  progress,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className={cn(
      'absolute inset-0 bg-background/80 backdrop-blur-sm',
      'flex items-center justify-center z-50',
      className
    )}>
      <AILoading 
        progress={progress}
        message={message}
        className="bg-card p-6 rounded-lg shadow-lg border"
      />
    </div>
  )
}
