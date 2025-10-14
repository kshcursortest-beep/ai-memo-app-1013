// app/notes/[id]/not-found.tsx
// 노트를 찾을 수 없을 때 표시되는 404 페이지
// 노트가 존재하지 않거나 권한이 없을 때 표시
// 관련 파일: app/notes/[id]/page.tsx

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NoteNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          {/* 404 아이콘 */}
          <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {/* 에러 메시지 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            노트를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600">
            요청하신 노트가 존재하지 않거나 접근 권한이 없습니다.
          </p>
        </div>

        {/* 목록으로 버튼 */}
        <Link href="/">
          <Button className="w-full sm:w-auto">
            노트 목록으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  )
}

