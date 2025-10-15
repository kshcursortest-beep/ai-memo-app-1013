// components/ui/error.tsx
// AI 처리 에러 상태 UI 컴포넌트
// 에러 메시지 표시, 재시도 버튼, 에러 타입별 처리
// 관련 파일: lib/types/ai.ts, components/ui/button.tsx, lib/utils/errorClassifier.ts

'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, RefreshCw, Wifi, Server, Clock, Key, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { classifyError, getRecommendedAction, isRetryableError } from '@/lib/utils/errorClassifier'
import { getErrorIcon, getErrorColor, getErrorSolutions } from '@/lib/utils/errorMessages'
import type { AIError, AIErrorType } from '@/lib/types/ai'
import { useState } from 'react'

interface ErrorIconProps {
  errorType: AIErrorType
  className?: string
}

export function ErrorIcon({ errorType, className }: ErrorIconProps) {
  const iconProps = { 
    className: cn('h-5 w-5', className),
    'data-testid': 'error-icon'
  }

  switch (errorType) {
    case 'NETWORK':
      return <Wifi {...iconProps} />
    case 'API':
    case 'SERVER_ERROR':
      return <Server {...iconProps} />
    case 'TIMEOUT':
      return <Clock {...iconProps} />
    case 'API_KEY_MISSING':
      return <Key {...iconProps} />
    case 'VALIDATION':
    case 'INVALID_REQUEST':
      return <AlertCircle {...iconProps} />
    default:
      return <AlertTriangle {...iconProps} />
  }
}

interface ErrorMessageProps {
  error: AIError
  showDetails?: boolean
  className?: string
}

export function ErrorMessage({ 
  error, 
  showDetails = false, 
  className 
}: ErrorMessageProps) {
  const { type, message } = error

  return (
    <div className={cn('flex items-start space-x-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5', className)}>
      <ErrorIcon errorType={type} className="text-destructive mt-0.5 flex-shrink-0" />
      
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-destructive">
          {message}
        </p>
        
        {showDetails && error.originalError != null && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              상세 정보 보기
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(error.originalError, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

interface RetryButtonProps {
  onRetry: () => void
  retryCount?: number
  maxRetries?: number
  disabled?: boolean
  className?: string
}

export function RetryButton({
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  disabled,
  className,
}: RetryButtonProps) {
  const canRetry = retryCount < maxRetries
  const retryText = canRetry 
    ? `다시 시도 (${retryCount}/${maxRetries})`
    : '재시도 횟수 초과'

  return (
    <Button
      onClick={onRetry}
      disabled={disabled || !canRetry}
      variant="outline"
      size="sm"
      className={cn('space-x-2', className)}
    >
      <RefreshCw className="h-4 w-4" />
      <span>{retryText}</span>
    </Button>
  )
}

interface AIErrorDisplayProps {
  error: AIError | Error | unknown
  onRetry?: () => void
  onReport?: () => void
  retryCount?: number
  maxRetries?: number
  showDetails?: boolean
  showSolutions?: boolean
  className?: string
}

export function AIErrorDisplay({
  error,
  onRetry,
  onReport,
  retryCount = 0,
  maxRetries = 3,
  showDetails = false,
  showSolutions = true,
  className,
}: AIErrorDisplayProps) {
  const [showFullSolutions, setShowFullSolutions] = useState(false)
  
  // 에러 분류
  const classifiedError = classifyError(error)
  const errorColor = getErrorColor(classifiedError.type)
  const recommendedAction = getRecommendedAction(classifiedError.type)
  const solutions = getErrorSolutions(classifiedError.type)
  const canRetry = isRetryableError(classifiedError.type)

  return (
    <div className={cn('space-y-4', className)}>
      {/* 에러 메시지 */}
      <div className="flex items-start space-x-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
        <ErrorIcon errorType={classifiedError.type} className="text-destructive mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">
            {classifiedError.message}
          </p>
          
          <p className="text-xs text-destructive/80">
            {recommendedAction}
          </p>
          
          {showDetails && classifiedError.originalError != null && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                상세 정보 보기
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(classifiedError.originalError, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* 해결 방법 */}
      {showSolutions && solutions.length > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">해결 방법:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            {solutions.slice(0, showFullSolutions ? solutions.length : 2).map((solution, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{solution}</span>
              </li>
            ))}
            {solutions.length > 2 && !showFullSolutions && (
              <li>
                <button
                  onClick={() => setShowFullSolutions(true)}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  더 보기 ({solutions.length - 2}개 더)
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* 액션 버튼들 */}
      <div className="flex items-center justify-center gap-2">
        {canRetry && onRetry && (
          <RetryButton
            onRetry={onRetry}
            retryCount={retryCount}
            maxRetries={maxRetries}
          />
        )}
        
        {onReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReport}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>문의하기</span>
          </Button>
        )}
      </div>
    </div>
  )
}

interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
  className?: string
}

export function ErrorBoundaryFallback({
  error,
  resetError,
  className,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className={cn('p-6 text-center space-y-4', className)}>
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-destructive">
          예상치 못한 오류가 발생했습니다
        </h3>
        <p className="text-sm text-muted-foreground">
          {error.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
      </div>
      
      <Button onClick={resetError} variant="outline">
        다시 시도
      </Button>
    </div>
  )
}
