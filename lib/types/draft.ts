// lib/types/draft.ts
// 노트 임시 저장 타입 정의
// 로컬 스토리지에 저장되는 임시 저장 데이터 구조
// 관련 파일: lib/utils/draftStorage.ts, app/notes/new/page.tsx

export interface NoteDraft {
  title: string
  content: string
  savedAt: string // ISO 8601 형식
  userId: string
}

export type DraftStatus = 'idle' | 'saving' | 'saved'

