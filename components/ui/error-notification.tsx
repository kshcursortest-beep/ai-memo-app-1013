// components/ui/error-notification.tsx
// 에러 알림 컴포넌트
// 토스트 알림 형태의 에러 표시 및 액션 제공
// 관련 파일: lib/types/ai.ts, lib/utils/errorClassifier.ts, components/ui/error.tsx

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'
import { classifyError, getRecommendedAction, isRetryableError } from '@/lib/utils/errorClassifier'
import { getErrorIcon, getErrorColor } from '@/lib/utils/errorMessages'
import { AIErrorType } from '@/lib/types/ai'
import type { AIError } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

interface ErrorNotificationProps {
  error: AIError | Error | unknown
  onRetry?: () => void
  onDismiss?: () => void
  onReport?: () => void
  autoHide?: boolean
  autoHideDelay?: number
  className?: string
}

/**
 * 에러 알림 컴포넌트
 * @param error - 에러 객체
 * @param onRetry - 재시도 콜백
 * @param onDismiss - 닫기 콜백
 * @param onReport - 에러 리포팅 콜백
 * @param autoHide - 자동 숨김 여부
 * @param autoHideDelay - 자동 숨김 지연 시간 (ms)
 * @param className - 추가 CSS 클래스
 */
export function ErrorNotification({
  error,
  onRetry,
  onDismiss,
  onReport,
  autoHide = false,
  autoHideDelay = 5000,
  className = '',
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)

  // 에러 분류
  const classifiedError = classifyError(error)
  const errorColor = getErrorColor(classifiedError.type)
  const errorIcon = getErrorIcon(classifiedError.type)
  const recommendedAction = getRecommendedAction(classifiedError.type)
  const canRetry = isRetryableError(classifiedError.type)

  // 자동 숨김 처리
  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, isVisible, onDismiss])

  // 재시도 처리
  const handleRetry = async () => {
    if (!canRetry || !onRetry) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  // 닫기 처리
  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  // 에러 리포팅 처리
  const handleReport = () => {
    onReport?.()
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className={cn('border-l-4 border-l-red-500 bg-red-50', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 에러 아이콘 */}
          <div className={cn('mt-0.5', errorColor)}>
            <AlertCircle className="h-5 w-5" />
          </div>

          {/* 에러 내용 */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-red-900 mb-1">
              {classifiedError.message}
            </h4>
            
            <p className="text-xs text-red-700 mb-3">
              {recommendedAction}
            </p>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-2">
              {canRetry && onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className={cn('mr-1 h-3 w-3', isRetrying && 'animate-spin')} />
                  {isRetrying ? '재시도 중...' : '재시도'}
                </Button>
              )}

              {onReport && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReport}
                  className="h-7 px-2 text-xs text-red-700 hover:text-red-800"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  문의하기
                </Button>
              )}

              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-7 px-2 text-xs text-red-700 hover:text-red-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 간단한 에러 토스트 컴포넌트
 */
interface ErrorToastProps {
  message: string
  type?: 'error' | 'warning' | 'info'
  onDismiss?: () => void
  className?: string
}

export function ErrorToast({
  message,
  type = 'error',
  onDismiss,
  className = '',
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) {
    return null
  }

  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-3 shadow-lg',
      typeStyles[type],
      className
    )}>
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
