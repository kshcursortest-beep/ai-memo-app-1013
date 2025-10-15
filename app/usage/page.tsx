// app/usage/page.tsx
// 사용량 모니터링 페이지
// 사용자의 AI 토큰 사용량을 조회하고 관리하는 페이지
// 관련 파일: app/actions/token-usage.ts, components/ui/usage-dashboard.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsageDashboard } from '@/components/ui/usage-dashboard'
import { UsageAlert } from '@/components/ui/usage-alert'
import { getTokenUsageStats } from '@/app/actions/token-usage'

export default async function UsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 사용량 통계 조회
  const statsResult = await getTokenUsageStats(user.id)
  const stats = statsResult.success ? statsResult.stats : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">사용량 모니터링</h1>
          <p className="text-gray-600">
            AI 기능 사용량과 비용을 확인하고 관리하세요.
          </p>
        </div>

        {/* 사용량 알림 */}
        <UsageAlert />

        {/* 사용량 대시보드 */}
        <UsageDashboard />

        {/* 추가 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 사용량 최적화 팁
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• 노트 내용을 간결하게 작성하면 토큰 사용량을 줄일 수 있습니다.</li>
              <li>• 긴 노트는 여러 개의 작은 노트로 나누어 처리하는 것이 효율적입니다.</li>
              <li>• 불필요한 재생성은 피하고, 결과에 만족할 때만 사용하세요.</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              📊 비용 정보
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>• 요약 생성: 평균 500-1000 토큰</p>
              <p>• 태그 생성: 평균 200-500 토큰</p>
              <p>• 재생성: 기존 생성과 동일한 토큰</p>
              <p>• 일일 제한: 50,000 토큰</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
