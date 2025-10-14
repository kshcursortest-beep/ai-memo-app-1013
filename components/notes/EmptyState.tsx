// components/notes/EmptyState.tsx
// 빈 상태 UI 컴포넌트 (노트가 없을 때 표시)
// 친근한 메시지, 주요 기능 소개, 템플릿 제안, 온보딩 다시 보기 옵션 제공
// 관련 파일: components/notes/NoteList.tsx, app/notes/new/page.tsx, components/notes/NoteTemplates.tsx

'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Sparkles, Edit3, Search } from 'lucide-react'
import { NoteTemplates } from './NoteTemplates'

interface EmptyStateProps {
  hasCompletedOnboarding: boolean
  onShowOnboarding?: () => void
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="mb-3 rounded-full bg-primary/10 p-3">
        {icon}
      </div>
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

export function EmptyState({ hasCompletedOnboarding, onShowOnboarding }: EmptyStateProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 환영 메시지 */}
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          환영합니다! 🎉
        </h3>
        <p className="text-gray-600 max-w-md">
          첫 노트를 작성하여 AI 메모장을 시작해보세요
        </p>
      </div>

      {/* 주요 기능 소개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 w-full max-w-3xl">
        <FeatureCard
          icon={<Edit3 className="h-6 w-6 text-primary" aria-hidden="true" />}
          title="쉬운 작성"
          description="텍스트와 음성으로 노트 작성"
        />
        <FeatureCard
          icon={<Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />}
          title="AI 요약"
          description="자동으로 내용 정리 및 요약"
        />
        <FeatureCard
          icon={<Search className="h-6 w-6 text-primary" aria-hidden="true" />}
          title="빠른 검색"
          description="태그 기반으로 쉽게 찾기"
        />
      </div>

      {/* CTA 버튼 */}
      <Button
        onClick={() => router.push('/notes/new')}
        size="lg"
        className="mb-4"
        aria-label="첫 노트 작성하기"
      >
        첫 노트 작성하기
      </Button>

      {/* 템플릿 제안 */}
      <NoteTemplates />

      {/* 온보딩 다시 보기 (온보딩 완료 사용자만) */}
      {hasCompletedOnboarding && onShowOnboarding && (
        <div className="mt-8">
          <Button
            variant="ghost"
            onClick={onShowOnboarding}
            aria-label="온보딩 다시 보기"
          >
            온보딩 다시 보기
          </Button>
        </div>
      )}
    </div>
  )
}

