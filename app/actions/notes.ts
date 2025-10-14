// app/actions/notes.ts
// 노트 관련 Server Actions
// 노트 생성, 조회, 수정, 삭제 기능 제공
// 관련 파일: drizzle/schema.ts, lib/db.ts, lib/supabase/server.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes } from '@/drizzle/schema'

/**
 * 새로운 노트 생성
 * @param title - 노트 제목 (최대 500자)
 * @param content - 노트 본문
 * @returns 성공 여부, 생성된 노트 ID 또는 에러 메시지
 */
export async function createNote(
  title: string,
  content: string
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. 입력값 유효성 검사
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      return {
        success: false,
        error: '제목을 입력해주세요.',
      }
    }

    if (trimmedTitle.length > 500) {
      return {
        success: false,
        error: '제목은 최대 500자까지 입력 가능합니다.',
      }
    }

    if (!trimmedContent) {
      return {
        success: false,
        error: '본문을 입력해주세요.',
      }
    }

    // 3. 노트 생성
    const [newNote] = await db.insert(notes).values({
      userId: user.id,
      title: trimmedTitle,
      content: trimmedContent,
    }).returning()

    return {
      success: true,
      noteId: newNote.id,
    }
  } catch (error) {
    console.error('노트 생성 실패:', error)
    return {
      success: false,
      error: '노트 저장에 실패했습니다. 다시 시도해주세요.',
    }
  }
}

