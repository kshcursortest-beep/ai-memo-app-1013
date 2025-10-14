// components/notes/NoteSortSelector.tsx
// 노트 정렬 옵션 선택 컴포넌트
// 최신순, 오래된순, 제목순 정렬 옵션 제공
// 관련 파일: lib/types/notes.ts, app/page.tsx

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SORT_OPTIONS, type SortOption } from '@/lib/types/notes'
import { ArrowUpDown } from 'lucide-react'

interface NoteSortSelectorProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function NoteSortSelector({ currentSort, onSortChange }: NoteSortSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <Select value={currentSort} onValueChange={onSortChange}>
        <SelectTrigger 
          className="w-full sm:w-[150px]" 
          aria-label="정렬 방식 선택"
        >
          <SelectValue placeholder="정렬 방식" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

