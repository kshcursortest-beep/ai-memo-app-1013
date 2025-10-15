// components/ui/usage-alert.tsx
// 사용량 알림 컴포넌트
// 토큰 사용량 한도 초과 시 사용자에게 알림
// 관련 파일: app/actions/token-usage.ts, components/ui/usage-chart.tsx

'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  X, 
  Zap, 
  DollarSign,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { checkDailyTokenLimit, getTokenUsage } from '@/app/actions/token-usage'
import { formatTokenCount, formatCost } from '@/lib/utils/token-calculator'
import { cn } from '@/lib/utils'

interface UsageAlertProps {
  className?: string
  onDismiss?: () => void
}

/**
 * 사용량 알림 컴포넌트
 * @param className - 추가 CSS 클래스
 * @param onDismiss - 알림 닫기 콜백
 */
export function UsageAlert({ className = '', onDismiss }: UsageAlertProps) {
  const [alertData, setAlertData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // 알림 데이터 로드
  const loadAlertData = async () => {
    setIsLoading(true)
    try {
      const limitResult = await checkDailyTokenLimit()
      if (limitResult.isExceeded) {
        setAlertData(limitResult)
      }
    } catch (error) {
      console.error('알림 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadAlertData()
  }, [])

  // 알림 닫기
  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  // 새로고침
  const handleRefresh = () => {
    loadAlertData()
  }

  if (isLoading) {
    return (
      <Alert className={className}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertTitle>사용량 확인 중...</AlertTitle>
        <AlertDescription>
          현재 사용량을 확인하고 있습니다.
        </AlertDescription>
      </Alert>
    )
  }

  if (!alertData || isDismissed) {
    return null
  }

  const { isExceeded, currentUsage, limit } = alertData
  const usagePercentage = (currentUsage / limit) * 100
  const isNearLimit = usagePercentage > 80 && !isExceeded

  if (!isExceeded && !isNearLimit) {
    return null
  }

  return (
    <Alert className={cn('border-l-4', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>
          {isExceeded ? '사용량 한도 초과' : '사용량 한도 근접'}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant={isExceeded ? 'destructive' : 'secondary'}>
            {usagePercentage.toFixed(1)}%
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {formatTokenCount(currentUsage)} / {formatTokenCount(limit)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">오늘</span>
          </div>
        </div>

        {isExceeded ? (
          <div className="space-y-2">
            <p className="text-sm text-red-700">
              일일 토큰 사용량 한도를 초과했습니다. 내일 다시 시도하거나 관리자에게 문의하세요.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-3 w-3 mr-1" />
                다시 확인
              </Button>
              <Button size="sm" variant="outline">
                관리자 문의
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-yellow-700">
              일일 토큰 사용량이 {usagePercentage.toFixed(1)}%에 도달했습니다. 
              남은 사용량: {formatTokenCount(limit - currentUsage)}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-3 w-3 mr-1" />
                다시 확인
              </Button>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * 간단한 사용량 상태 표시
 */
interface UsageStatusProps {
  currentUsage: number
  limit: number
  className?: string
}

export function UsageStatus({ currentUsage, limit, className = '' }: UsageStatusProps) {
  const usagePercentage = (currentUsage / limit) * 100
  const isNearLimit = usagePercentage > 80
  const isOverLimit = usagePercentage >= 100

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <Zap className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">
          {formatTokenCount(currentUsage)}
        </span>
        <span className="text-sm text-gray-500">
          / {formatTokenCount(limit)}
        </span>
      </div>
      
      <Badge 
        variant={isOverLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
        className="text-xs"
      >
        {usagePercentage.toFixed(1)}%
      </Badge>
    </div>
  )
}

/**
 * 사용량 제한 도달 시 표시되는 경고
 */
interface UsageLimitWarningProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function UsageLimitWarning({ message, onRetry, className = '' }: UsageLimitWarningProps) {
  return (
    <Alert className={cn('border-red-200 bg-red-50', className)}>
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-800">사용량 한도 초과</AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            다시 확인
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
