// app/notes/[id]/page.tsx
// 노트 상세 조회 페이지
// 노트의 전체 내용(제목, 본문, 날짜)을 표시
// 관련 파일: app/actions/notes.ts, lib/utils/dateFormat.ts, components/ui/button.tsx

import { getNoteById } from '@/app/actions/notes'
import { formatDate } from '@/lib/utils/dateFormat'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface NoteDetailPageProps {
  params: {
    id: string
  }
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const result = await getNoteById(params.id)

  // 에러 처리: 노트 없음 또는 권한 없음
  if (!result.success || !result.data) {
    notFound()
  }

  const note = result.data
  const isModified = note.updatedAt.getTime() !== note.createdAt.getTime()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 네비게이션 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              목록으로
            </Button>
          </Link>
        </div>

        {/* 노트 상세 */}
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* 제목 */}
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 break-words">
              {note.title}
            </h1>

            {/* 날짜 정보 */}
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="font-medium">작성일:</span>
                <time dateTime={note.createdAt.toISOString()}>
                  {formatDate(note.createdAt)}
                </time>
              </div>
              {isModified && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">수정일:</span>
                  <time dateTime={note.updatedAt.toISOString()}>
                    {formatDate(note.updatedAt)}
                  </time>
                </div>
              )}
            </div>
          </header>

          {/* 본문 */}
          <main>
            <p className="text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
              {note.content}
            </p>
          </main>
        </article>
      </div>
    </div>
  )
}

