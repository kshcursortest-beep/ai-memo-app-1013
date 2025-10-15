// components/ui/usage-chart.tsx
// 사용량 차트 컴포넌트
// 토큰 사용량을 시각적으로 표시하는 차트 컴포넌트
// 관련 파일: components/ui/usage-dashboard.tsx, lib/utils/token-calculator.ts

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UsageChartProps {
  data: Array<{
    date: string
    tokens: number
    cost: number
  }>
  className?: string
}

/**
 * 사용량 차트 컴포넌트
 * @param data - 차트 데이터 배열
 * @param className - 추가 CSS 클래스
 */
export function UsageChart({ data, className = '' }: UsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">사용량 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  const maxTokens = Math.max(...data.map(d => d.tokens))
  const maxCost = Math.max(...data.map(d => d.cost))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          사용량 추이
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const tokenPercentage = (item.tokens / maxTokens) * 100
            const costPercentage = (item.cost / maxCost) * 100

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.tokens.toLocaleString()} 토큰</span>
                    <span className="text-gray-500">${item.cost.toFixed(4)}</span>
                  </div>
                </div>
                
                {/* 토큰 사용량 바 */}
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${tokenPercentage}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {tokenPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 비용 표시 바 */}
                <div className="relative">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${costPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 간단한 사용량 미터
 */
interface UsageMeterProps {
  current: number
  limit: number
  label?: string
  className?: string
}

export function UsageMeter({ current, limit, label = '사용량', className = '' }: UsageMeterProps) {
  const percentage = Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage > 80
  const isOverLimit = percentage >= 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {current.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isOverLimit && 'bg-red-500',
              !isOverLimit && isNearLimit && 'bg-yellow-500',
              !isOverLimit && !isNearLimit && 'bg-green-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white font-medium">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {isNearLimit && (
        <p className="text-xs text-yellow-600">
          {isOverLimit ? '사용량 한도를 초과했습니다.' : '사용량 한도에 근접했습니다.'}
        </p>
      )}
    </div>
  )
}

/**
 * 사용량 요약 카드
 */
interface UsageSummaryProps {
  totalTokens: number
  totalCost: number
  averagePerRequest: number
  requestCount: number
  className?: string
}

export function UsageSummary({ 
  totalTokens, 
  totalCost, 
  averagePerRequest, 
  requestCount, 
  className = '' 
}: UsageSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          사용량 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
            <p className="text-xs text-gray-600">총 토큰</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(4)}</p>
            <p className="text-xs text-gray-600">총 비용</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{averagePerRequest.toLocaleString()}</p>
            <p className="text-xs text-gray-600">평균 토큰/요청</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{requestCount}</p>
            <p className="text-xs text-gray-600">총 요청 수</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
