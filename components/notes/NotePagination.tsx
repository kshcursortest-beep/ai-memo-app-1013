// components/notes/NotePagination.tsx
// 페이지네이션 컴포넌트
// 이전/다음 버튼 및 현재 페이지 번호 표시, 정렬 상태 유지
// 관련 파일: app/page.tsx

'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SortOption } from '@/lib/types/notes'

interface NotePaginationProps {
  currentPage: number
  totalPages: number
  total: number
  currentSort: SortOption
}

export function NotePagination({ currentPage, totalPages, total, currentSort }: NotePaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 페이지네이션이 필요 없는 경우 (노트가 10개 이하)
  if (totalPages <= 1) {
    return null
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    
    // 정렬 옵션 유지 (기본값이 아닌 경우에만 추가)
    if (currentSort !== 'latest') {
      params.set('sort', currentSort)
    }
    
    router.push(`/?${params.toString()}`)
  }

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-6 sm:px-0">
      {/* 이전 버튼 */}
      <div className="flex flex-1 justify-start">
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="이전 페이지"
          className="inline-flex items-center"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          이전
        </Button>
      </div>

      {/* 페이지 정보 */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{currentPage}</span>
          <span className="mx-2">/</span>
          <span className="font-medium">{totalPages}</span>
          <span className="ml-4 text-gray-500">
            (전체 {total}개)
          </span>
        </p>
      </div>

      {/* 모바일용 페이지 정보 */}
      <div className="flex sm:hidden flex-1 justify-center">
        <p className="text-sm text-gray-700">
          {currentPage} / {totalPages}
        </p>
      </div>

      {/* 다음 버튼 */}
      <div className="flex flex-1 justify-end">
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="다음 페이지"
          className="inline-flex items-center"
        >
          다음
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

