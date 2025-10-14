// components/notes/NoteCard.tsx
// 개별 노트 카드 컴포넌트
// 제목, 본문 미리보기, 작성일시 표시
// 관련 파일: components/notes/NoteList.tsx, lib/utils/dateFormat.ts

'use client'

import { Card } from '@/components/ui/card'
import { formatDate, truncateText } from '@/lib/utils/dateFormat'
import { useRouter } from 'next/navigation'

interface NoteCardProps {
  id: string
  title: string
  content: string
  createdAt: Date
}

export function NoteCard({ id, title, content, createdAt }: NoteCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/notes/${id}`)
  }

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer p-6 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      role="article"
      aria-label={`노트: ${title}`}
    >
      {/* 제목 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {title}
      </h3>

      {/* 본문 미리보기 */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {truncateText(content, 100)}
      </p>

      {/* 작성일시 */}
      <div className="flex items-center text-xs text-gray-500">
        <time dateTime={createdAt.toISOString()}>
          {formatDate(createdAt)}
        </time>
      </div>
    </Card>
  )
}

