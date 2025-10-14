// lib/types/notes.ts
// 노트 관련 타입 정의 및 유틸리티 함수
// 정렬 옵션 타입, 검증 함수 제공
// 관련 파일: app/actions/notes.ts, components/notes/NoteSortSelector.tsx

export type SortOption = 'latest' | 'oldest' | 'title'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'title', label: '제목순' },
]

/**
 * 문자열이 유효한 SortOption인지 검증
 * @param value - 검증할 문자열
 * @returns value가 유효한 SortOption이면 true
 */
export function isValidSortOption(value: string): value is SortOption {
  return ['latest', 'oldest', 'title'].includes(value)
}

/**
 * 문자열을 SortOption으로 변환 (유효성 검사 포함)
 * @param value - 변환할 문자열 (null/undefined 허용)
 * @returns 유효한 SortOption 또는 기본값 'latest'
 */
export function getSortOption(value: string | null | undefined): SortOption {
  if (value && isValidSortOption(value)) {
    return value
  }
  return 'latest' // 기본값
}

