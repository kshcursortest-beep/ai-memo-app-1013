// components/ui/token-usage-display.tsx
// 토큰 사용량 표시 컴포넌트
// AI 처리 완료 시 토큰 사용량을 표시
// 관련 파일: app/actions/token-usage.ts, lib/utils/token-calculator.ts

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/loading'
import { Zap, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatTokenCount, formatCost, getTokenUsageStatus } from '@/lib/utils/token-calculator'
import { cn } from '@/lib/utils'

interface TokenUsageDisplayProps {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  model: string
  operationType: 'summary' | 'tags' | 'regeneration'
  className?: string
  showDetails?: boolean
}

/**
 * 토큰 사용량 표시 컴포넌트
 * @param inputTokens - 입력 토큰 수
 * @param outputTokens - 출력 토큰 수
 * @param totalTokens - 총 토큰 수
 * @param cost - 비용 (USD)
 * @param model - 사용된 AI 모델
 * @param operationType - 작업 타입
 * @param className - 추가 CSS 클래스
 * @param showDetails - 상세 정보 표시 여부
 */
export function TokenUsageDisplay({
  inputTokens,
  outputTokens,
  totalTokens,
  cost,
  model,
  operationType,
  className = '',
  showDetails = false,
}: TokenUsageDisplayProps) {
  const [isVisible, setIsVisible] = useState(true)

  // 3초 후 자동 숨김
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) {
    return null
  }

  const operationLabels = {
    summary: '요약 생성',
    tags: '태그 생성',
    regeneration: '재생성',
  }

  return (
    <Card className={cn('border-l-4 border-l-blue-500 bg-blue-50', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {operationLabels[operationType]} 완료
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatTokenCount(totalTokens)} 토큰
          </Badge>
        </div>

        {showDetails && (
          <div className="mt-2 space-y-1 text-xs text-blue-700">
            <div className="flex justify-between">
              <span>입력:</span>
              <span>{formatTokenCount(inputTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span>출력:</span>
              <span>{formatTokenCount(outputTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span>비용:</span>
              <span>{formatCost(cost)}</span>
            </div>
            <div className="flex justify-between">
              <span>모델:</span>
              <span>{model}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 토큰 사용량 요약 컴포넌트
 */
interface TokenUsageSummaryProps {
  totalTokens: number
  totalCost: number
  operationCounts: Record<'summary' | 'tags' | 'regeneration', number>
  className?: string
}

export function TokenUsageSummary({
  totalTokens,
  totalCost,
  operationCounts,
  className = '',
}: TokenUsageSummaryProps) {
  const totalOperations = Object.values(operationCounts).reduce((sum, count) => sum + count, 0)
  const averageTokensPerOperation = totalOperations > 0 ? totalTokens / totalOperations : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          토큰 사용량 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatTokenCount(totalTokens)}
            </div>
            <div className="text-xs text-gray-500">총 토큰</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatCost(totalCost)}
            </div>
            <div className="text-xs text-gray-500">총 비용</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>요약 생성:</span>
            <span>{operationCounts.summary}회</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>태그 생성:</span>
            <span>{operationCounts.tags}회</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>재생성:</span>
            <span>{operationCounts.regeneration}회</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>평균 토큰/요청:</span>
            <span>{formatTokenCount(Math.round(averageTokensPerOperation))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 토큰 사용량 경고 컴포넌트
 */
interface TokenUsageAlertProps {
  currentUsage: number
  limit: number
  className?: string
}

export function TokenUsageAlert({
  currentUsage,
  limit,
  className = '',
}: TokenUsageAlertProps) {
  const status = getTokenUsageStatus(currentUsage, limit)

  if (status.status === 'safe') {
    return null
  }

  const statusConfig = {
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    danger: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    exceeded: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  }

  const config = statusConfig[status.status]
  const Icon = config.icon

  return (
    <Card className={cn('border-l-4', config.borderColor, config.bgColor, className)}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Icon className={cn('h-4 w-4 mt-0.5', config.color)} />
          <div className="flex-1">
            <p className={cn('text-sm font-medium', config.color)}>
              {status.message}
            </p>
            <div className="mt-2">
              <Progress value={status.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{formatTokenCount(currentUsage)} 사용</span>
                <span>{formatTokenCount(status.remaining)} 남음</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
