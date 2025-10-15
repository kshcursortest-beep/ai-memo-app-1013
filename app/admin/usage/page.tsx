// app/admin/usage/page.tsx
// 관리자용 사용량 모니터링 페이지
// 전체 사용자들의 AI 토큰 사용량을 모니터링하는 관리자 전용 페이지
// 관련 파일: components/ui/admin-usage-monitor.tsx, app/actions/token-usage.ts

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsageMonitor } from '@/components/ui/admin-usage-monitor'

export default async function AdminUsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: 관리자 권한 확인 로직 추가
  // const isAdmin = await checkAdminRole(user.id)
  // if (!isAdmin) {
  //   redirect('/')
  // }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">관리자 사용량 모니터링</h1>
          <p className="text-gray-600">
            전체 사용자들의 AI 토큰 사용량을 모니터링하고 관리하세요.
          </p>
        </div>

        {/* 관리자 사용량 모니터 */}
        <AdminUsageMonitor />

        {/* 관리자 도구 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">
              ⚠️ 사용량 제한 관리
            </h3>
            <p className="text-sm text-red-800 mb-3">
              사용자별 일일 토큰 사용량 제한을 조정할 수 있습니다.
            </p>
            <button className="text-sm text-red-600 hover:text-red-700 underline">
              제한 설정 관리 →
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              📈 사용량 분석
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              사용량 패턴과 트렌드를 분석하여 서비스 최적화에 활용하세요.
            </p>
            <button className="text-sm text-yellow-600 hover:text-yellow-700 underline">
              분석 리포트 보기 →
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💰 비용 관리
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              AI 서비스 비용을 모니터링하고 예산을 관리하세요.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 underline">
              비용 리포트 보기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
