// components/ui/usage-dashboard.tsx
// 사용량 대시보드 컴포넌트
// 일일/월별 토큰 사용량 통계 및 차트 표시
// 관련 파일: app/actions/token-usage.ts, components/ui/token-usage-display.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Zap, 
  DollarSign,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { getTokenUsage, getTokenUsageStats } from '@/app/actions/token-usage'
import { formatTokenCount, formatCost, getTokenUsageStatus } from '@/lib/utils/token-calculator'
import { cn } from '@/lib/utils'

interface UsageDashboardProps {
  className?: string
}

type Period = 'today' | 'week' | 'month' | 'year'

/**
 * 사용량 대시보드 컴포넌트
 * @param className - 추가 CSS 클래스
 */
export function UsageDashboard({ className = '' }: UsageDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today')
  const [usageData, setUsageData] = useState<any>(null)
  const [statsData, setStatsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 데이터 로드
  const loadData = async (period: Period) => {
    setIsLoading(true)
    setError(null)

    try {
      const [usageResult, statsResult] = await Promise.all([
        getTokenUsage(period),
        getTokenUsageStats(),
      ])

      if (usageResult.success) {
        setUsageData(usageResult.usage)
      } else {
        setError(usageResult.error || '사용량 데이터를 불러올 수 없습니다.')
      }

      if (statsResult.success) {
        setStatsData(statsResult.stats)
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    loadData(selectedPeriod)
  }, [selectedPeriod])

  // 새로고침
  const handleRefresh = () => {
    loadData(selectedPeriod)
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          사용량 대시보드
        </h2>
        <Button onClick={handleRefresh} size="sm" variant="outline" disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {(['today', 'week', 'month', 'year'] as Period[]).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
            disabled={isLoading}
          >
            {period === 'today' && '오늘'}
            {period === 'week' && '이번 주'}
            {period === 'month' && '이번 달'}
            {period === 'year' && '올해'}
          </Button>
        ))}
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 총 토큰 사용량 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 토큰 사용량</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageData ? formatTokenCount(usageData.totalTokens) : '0'}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* 총 비용 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 비용</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageData ? formatCost(usageData.totalCost) : '$0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* 평균 토큰/요청 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 토큰/요청</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData ? formatTokenCount(Math.round(statsData.averageTokensPerRequest)) : '0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 작업 타입별 사용량 */}
      {usageData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              작업 타입별 사용량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(usageData.operationCounts).map(([operation, count]) => (
                <div key={operation} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {operation === 'summary' && '요약 생성'}
                      {operation === 'tags' && '태그 생성'}
                      {operation === 'regeneration' && '재생성'}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{count}회</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 일별 사용량 차트 */}
      {usageData && usageData.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              일별 사용량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usageData.dailyUsage.slice(0, 7).map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatTokenCount(day.tokens)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({formatCost(day.cost)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-600">데이터를 불러오는 중...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * 간단한 사용량 위젯
 */
interface UsageWidgetProps {
  totalTokens: number
  totalCost: number
  className?: string
}

export function UsageWidget({ totalTokens, totalCost, className = '' }: UsageWidgetProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">오늘 사용량</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTokenCount(totalTokens)}
            </p>
            <p className="text-xs text-gray-500">
              {formatCost(totalCost)}
            </p>
          </div>
          <Zap className="h-6 w-6 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  )
}
