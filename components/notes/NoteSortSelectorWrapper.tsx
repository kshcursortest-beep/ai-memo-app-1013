// components/notes/NoteSortSelectorWrapper.tsx
// 노트 정렬 선택 래퍼 컴포넌트 (URL 상태 관리)
// NoteSortSelector의 클라이언트 측 네비게이션 로직 처리
// 관련 파일: components/notes/NoteSortSelector.tsx, app/page.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { NoteSortSelector } from './NoteSortSelector'
import type { SortOption } from '@/lib/types/notes'

interface NoteSortSelectorWrapperProps {
  currentSort: SortOption
}

export function NoteSortSelectorWrapper({ currentSort }: NoteSortSelectorWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // 정렬 옵션 업데이트
    params.set('sort', newSort)
    
    // 정렬 변경 시 1페이지로 리셋
    params.delete('page')
    
    router.push(`/?${params.toString()}`)
  }

  return <NoteSortSelector currentSort={currentSort} onSortChange={handleSortChange} />
}

