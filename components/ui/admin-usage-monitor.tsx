// components/ui/admin-usage-monitor.tsx
// 관리자용 사용량 모니터링 컴포넌트
// 전체 사용자들의 토큰 사용량을 모니터링하는 관리자 전용 컴포넌트
// 관련 파일: app/actions/token-usage.ts, components/ui/usage-dashboard.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Search,
  RefreshCw,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminUsageMonitorProps {
  className?: string
}

interface UserUsageData {
  userId: string
  email: string
  totalTokens: number
  totalCost: number
  requestCount: number
  lastActivity: string
}

/**
 * 관리자용 사용량 모니터링 컴포넌트
 * @param className - 추가 CSS 클래스
 */
export function AdminUsageMonitor({ className = '' }: AdminUsageMonitorProps) {
  const [users, setUsers] = useState<UserUsageData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserUsageData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'tokens' | 'cost' | 'requests' | 'activity'>('tokens')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 사용자 데이터 로드 (실제로는 서버 액션 호출)
  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: 실제 서버 액션으로 교체
      // const result = await getAdminUsageStats()
      // if (result.success) {
      //   setUsers(result.users)
      // } else {
      //   setError(result.error)
      // }

      // 임시 데이터 (실제 구현 시 제거)
      const mockUsers: UserUsageData[] = [
        {
          userId: '1',
          email: 'user1@example.com',
          totalTokens: 15000,
          totalCost: 0.045,
          requestCount: 25,
          lastActivity: '2024-12-20 14:30'
        },
        {
          userId: '2',
          email: 'user2@example.com',
          totalTokens: 8500,
          totalCost: 0.025,
          requestCount: 15,
          lastActivity: '2024-12-20 13:15'
        },
        {
          userId: '3',
          email: 'user3@example.com',
          totalTokens: 22000,
          totalCost: 0.066,
          requestCount: 35,
          lastActivity: '2024-12-20 15:45'
        }
      ]
      setUsers(mockUsers)
    } catch (err) {
      setError('사용자 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadUsers()
  }, [])

  // 검색 필터링
  useEffect(() => {
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  // 정렬
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortBy) {
      case 'tokens':
        aValue = a.totalTokens
        bValue = b.totalTokens
        break
      case 'cost':
        aValue = a.totalCost
        bValue = b.totalCost
        break
      case 'requests':
        aValue = a.requestCount
        bValue = b.requestCount
        break
      case 'activity':
        aValue = a.lastActivity
        bValue = b.lastActivity
        break
      default:
        aValue = a.totalTokens
        bValue = b.totalTokens
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // 총계 계산
  const totals = users.reduce((acc, user) => ({
    totalTokens: acc.totalTokens + user.totalTokens,
    totalCost: acc.totalCost + user.totalCost,
    totalRequests: acc.totalRequests + user.requestCount
  }), { totalTokens: 0, totalCost: 0, totalRequests: 0 })

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button onClick={loadUsers} size="sm" variant="outline">
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
          <Users className="h-5 w-5" />
          사용량 모니터링
        </h2>
        <Button onClick={loadUsers} size="sm" variant="outline" disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 총계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 토큰 사용량</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totals.totalTokens.toLocaleString()}
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 비용</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totals.totalCost.toFixed(4)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 정렬 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="사용자 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="tokens">토큰 사용량</option>
                <option value="cost">비용</option>
                <option value="requests">요청 수</option>
                <option value="activity">최근 활동</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            사용자별 사용량 ({filteredUsers.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUsers.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-sm text-gray-600">
                      마지막 활동: {user.lastActivity}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">{user.totalTokens.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">토큰</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">${user.totalCost.toFixed(4)}</p>
                      <p className="text-xs text-gray-600">비용</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{user.requestCount}</p>
                      <p className="text-xs text-gray-600">요청</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.totalTokens > 20000 ? '높음' : user.totalTokens > 10000 ? '보통' : '낮음'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
