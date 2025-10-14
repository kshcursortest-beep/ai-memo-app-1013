// components/notes/EmptyState.tsx
// 빈 상태 UI 컴포넌트 (노트가 없을 때 표시)
// "새 노트 작성" 버튼 제공
// 관련 파일: components/notes/NoteList.tsx, app/notes/new/page.tsx

'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'

export function EmptyState() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 아이콘 */}
      <div className="mb-6 rounded-full bg-gray-100 p-6">
        <FileText className="h-12 w-12 text-gray-400" />
      </div>

      {/* 메시지 */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        아직 작성한 노트가 없습니다
      </h3>
      <p className="mb-8 text-center text-gray-600 max-w-md">
        첫 번째 노트를 작성하여 아이디어와 정보를 기록해보세요
      </p>

      {/* 새 노트 작성 버튼 */}
      <Button
        onClick={() => router.push('/notes/new')}
        size="lg"
        aria-label="새 노트 작성"
      >
        + 새 노트 작성
      </Button>
    </div>
  )
}

