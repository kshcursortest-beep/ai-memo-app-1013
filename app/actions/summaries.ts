// app/actions/summaries.ts
// AI 요약 관련 Server Actions
// 노트 요약 생성, 조회, 재생성 기능 제공
// 관련 파일: drizzle/schema.ts, lib/gemini/generateText.ts, lib/gemini/prompts.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes, summaries } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { generateText } from '@/lib/gemini/generateText'
import { createSummaryPrompt, truncateNoteContent } from '@/lib/gemini/prompts'
import { DEFAULT_GEMINI_MODEL } from '@/lib/gemini/client'

/**
 * 최소 노트 내용 길이 (문자 수)
 */
const MIN_NOTE_CONTENT_LENGTH = 50

/**
 * 노트 요약 생성
 * @param noteId - 요약할 노트 ID
 * @returns 성공 여부, 생성된 요약 또는 에러 메시지
 */
export async function generateSummary(
  noteId: string
): Promise<{
  success: boolean
  summary?: {
    id: string
    content: string
    model: string
    createdAt: Date
  }
  error?: string
}> {
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

    // 2. noteId 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효한 노트 ID가 필요합니다.',
      }
    }

    // 3. 노트 조회 및 권한 검증 (사용자 스코프)
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.',
      }
    }

    // 4. 노트 내용 유효성 검사 (최소 길이)
    const trimmedContent = note.content.trim()

    if (trimmedContent.length < MIN_NOTE_CONTENT_LENGTH) {
      return {
        success: false,
        error: `노트 내용이 너무 짧습니다. 최소 ${MIN_NOTE_CONTENT_LENGTH}자 이상 작성해주세요.`,
      }
    }

    // 5. 요약 생성 프롬프트 구성
    const truncatedContent = truncateNoteContent(trimmedContent)
    const prompt = createSummaryPrompt(truncatedContent)

    // 6. Gemini API 호출
    const result = await generateText(prompt)

    if (!result.success || !result.text) {
      return {
        success: false,
        error: result.error || '요약 생성에 실패했습니다. 다시 시도해주세요.',
      }
    }

    const summaryContent = result.text.trim()

    // 7. 기존 요약 확인
    const [existingSummary] = await db
      .select()
      .from(summaries)
      .where(eq(summaries.noteId, noteId))
      .limit(1)

    let savedSummary

    // 8. 기존 요약이 있으면 UPDATE, 없으면 INSERT
    if (existingSummary) {
      // UPDATE
      const [updatedSummary] = await db
        .update(summaries)
        .set({
          content: summaryContent,
          model: DEFAULT_GEMINI_MODEL,
        })
        .where(eq(summaries.noteId, noteId))
        .returning()

      savedSummary = updatedSummary
    } else {
      // INSERT
      const [newSummary] = await db
        .insert(summaries)
        .values({
          noteId,
          model: DEFAULT_GEMINI_MODEL,
          content: summaryContent,
        })
        .returning()

      savedSummary = newSummary
    }

    // 9. 성공 응답 반환
    return {
      success: true,
      summary: {
        id: savedSummary.id,
        content: savedSummary.content,
        model: savedSummary.model,
        createdAt: savedSummary.createdAt,
      },
    }
  } catch (error) {
    console.error('요약 생성 실패:', error)
    return {
      success: false,
      error: '요약 생성에 실패했습니다. 다시 시도해주세요.',
    }
  }
}

/**
 * 노트의 요약 조회
 * @param noteId - 조회할 노트 ID
 * @returns 성공 여부, 요약 데이터 또는 에러 메시지
 */
export async function getSummary(
  noteId: string
): Promise<{
  success: boolean
  summary?: {
    id: string
    content: string
    model: string
    createdAt: Date
  } | null
  error?: string
}> {
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

    // 2. noteId 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효한 노트 ID가 필요합니다.',
      }
    }

    // 3. 노트 소유자 확인 (사용자 스코프)
    const [note] = await db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.',
      }
    }

    // 4. 요약 조회
    const [summary] = await db
      .select()
      .from(summaries)
      .where(eq(summaries.noteId, noteId))
      .limit(1)

    return {
      success: true,
      summary: summary || null,
    }
  } catch (error) {
    console.error('요약 조회 실패:', error)
    return {
      success: false,
      error: '요약 조회에 실패했습니다.',
    }
  }
}

