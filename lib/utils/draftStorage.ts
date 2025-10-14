// lib/utils/draftStorage.ts
// 노트 임시 저장 로컬 스토리지 유틸리티
// 로컬 스토리지에 임시 저장 데이터를 저장/조회/삭제하는 함수들
// 관련 파일: lib/types/draft.ts, app/notes/new/page.tsx

import { NoteDraft } from '@/lib/types/draft'

const DRAFT_KEY_PREFIX = 'note-draft-'

/**
 * 로컬 스토리지 키 생성
 */
function getDraftKey(userId: string): string {
  return `${DRAFT_KEY_PREFIX}${userId}`
}

/**
 * 임시 저장 데이터 저장
 * @param userId - 사용자 ID
 * @param title - 노트 제목
 * @param content - 노트 본문
 * @returns 성공 여부
 */
export function saveDraft(
  userId: string,
  title: string,
  content: string
): boolean {
  try {
    // 제목과 본문이 모두 비어있으면 저장하지 않음
    if (!title.trim() && !content.trim()) {
      return false
    }

    const draft: NoteDraft = {
      title,
      content,
      savedAt: new Date().toISOString(),
      userId,
    }

    const key = getDraftKey(userId)
    localStorage.setItem(key, JSON.stringify(draft))
    return true
  } catch (error) {
    // QuotaExceededError, SecurityError 등 무시
    console.warn('임시 저장 실패:', error)
    return false
  }
}

/**
 * 임시 저장 데이터 조회
 * @param userId - 사용자 ID
 * @returns 임시 저장 데이터 또는 null
 */
export function getDraft(userId: string): NoteDraft | null {
  try {
    const key = getDraftKey(userId)
    const data = localStorage.getItem(key)

    if (!data) {
      return null
    }

    const draft = JSON.parse(data) as NoteDraft

    // 데이터 유효성 검증
    if (
      typeof draft.title !== 'string' ||
      typeof draft.content !== 'string' ||
      typeof draft.savedAt !== 'string' ||
      typeof draft.userId !== 'string'
    ) {
      // 손상된 데이터 삭제
      clearDraft(userId)
      return null
    }

    // userId 불일치 시 무시
    if (draft.userId !== userId) {
      return null
    }

    return draft
  } catch (error) {
    // JSON 파싱 에러 등
    console.warn('임시 저장 조회 실패:', error)
    // 손상된 데이터 삭제 시도
    try {
      clearDraft(userId)
    } catch {
      // 무시
    }
    return null
  }
}

/**
 * 임시 저장 데이터 삭제
 * @param userId - 사용자 ID
 */
export function clearDraft(userId: string): void {
  try {
    const key = getDraftKey(userId)
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('임시 저장 삭제 실패:', error)
  }
}

/**
 * 임시 저장 데이터 존재 여부 확인
 * @param userId - 사용자 ID
 * @returns 존재 여부
 */
export function hasDraft(userId: string): boolean {
  return getDraft(userId) !== null
}

