// app/actions/tags.ts
// AI 태그 관련 Server Actions
// 노트 태그 생성, 조회, 재생성 기능 제공
// 관련 파일: drizzle/schema.ts, lib/gemini/generateText.ts, lib/gemini/prompts.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes, noteTags } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { generateText } from '@/lib/gemini/generateText'
import { createTagPrompt, truncateNoteContent } from '@/lib/gemini/prompts'
import { DEFAULT_GEMINI_MODEL } from '@/lib/gemini/client'
import { recordTokenUsage } from '@/app/actions/token-usage'
import { estimateTokenCount } from '@/lib/utils/token-calculator'
import type { AIError, AIErrorType } from '@/lib/types/ai'

/**
 * 최소 노트 내용 길이 (문자 수)
 */
const MIN_NOTE_CONTENT_LENGTH = 50

/**
 * 최대 태그 개수
 */
const MAX_TAGS_COUNT = 6

/**
 * 임시 태그 생성 (노트 생성 전)
 * @param content - 태그를 생성할 노트 내용
 * @returns 성공 여부, 생성된 태그 목록, AI 에러 정보 또는 에러 메시지
 */
export async function generateTempTags(
  content: string
): Promise<{
  success: boolean
  tags?: string[]
  error?: string
  aiError?: AIError
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

    // 2. 내용 유효성 검사 (최소 길이)
    const trimmedContent = content.trim()

    if (trimmedContent.length < MIN_NOTE_CONTENT_LENGTH) {
      return {
        success: false,
        error: `노트 내용이 너무 짧습니다. 최소 ${MIN_NOTE_CONTENT_LENGTH}자 이상 작성해주세요.`,
      }
    }

    // 3. 태그 생성 프롬프트 구성
    const truncatedContent = truncateNoteContent(trimmedContent)
    const prompt = createTagPrompt(truncatedContent)

    // 4. Gemini API 호출
    const result = await generateText(prompt)

    if (!result.success || !result.text) {
      const aiError: AIError = {
        type: 'API' as AIErrorType,
        message: result.error || '태그 생성에 실패했습니다. 다시 시도해주세요.',
        originalError: result.error,
        action: 'retry',
      }
      
      return {
        success: false,
        error: result.error || '태그 생성에 실패했습니다. 다시 시도해주세요.',
        aiError,
      }
    }

    // 5. AI 응답에서 태그 추출 및 정리
    const rawTags = result.text.trim()
    const tags = parseTagsFromResponse(rawTags)

    if (tags.length === 0) {
      return {
        success: false,
        error: '생성된 태그가 없습니다. 다시 시도해주세요.',
      }
    }

    // 6. 태그 개수 제한 (최대 6개)
    const limitedTags = tags.slice(0, MAX_TAGS_COUNT)

    // 7. 성공 응답 반환
    return {
      success: true,
      tags: limitedTags,
    }
  } catch (error) {
    console.error('임시 태그 생성 실패:', error)
    
    const aiError: AIError = {
      type: 'UNKNOWN_ERROR' as AIErrorType,
      message: '태그 생성에 실패했습니다. 다시 시도해주세요.',
      originalError: error,
      action: 'retry',
    }
    
    return {
      success: false,
      error: '태그 생성에 실패했습니다. 다시 시도해주세요.',
      aiError,
    }
  }
}
export async function generateTags(
  noteId: string
): Promise<{
  success: boolean
  tags?: string[]
  error?: string
  aiError?: AIError
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

    // 5. 태그 생성 프롬프트 구성
    const truncatedContent = truncateNoteContent(trimmedContent)
    const prompt = createTagPrompt(truncatedContent)

    // 6. Gemini API 호출
    const result = await generateText(prompt)

    if (!result.success || !result.text) {
      const aiError: AIError = {
        type: 'API' as AIErrorType,
        message: result.error || '태그 생성에 실패했습니다. 다시 시도해주세요.',
        originalError: result.error,
        action: 'retry',
      }
      
      return {
        success: false,
        error: result.error || '태그 생성에 실패했습니다. 다시 시도해주세요.',
        aiError,
      }
    }

    // 7. AI 응답에서 태그 추출 및 정리
    const rawTags = result.text.trim()
    const tags = parseTagsFromResponse(rawTags)

    if (tags.length === 0) {
      return {
        success: false,
        error: '생성된 태그가 없습니다. 다시 시도해주세요.',
      }
    }

    // 8. 태그 개수 제한 (최대 6개)
    const limitedTags = tags.slice(0, MAX_TAGS_COUNT)

    // 9. 기존 태그 삭제 (note_tags 테이블에서 해당 note_id의 모든 태그 삭제)
    await db
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId))

    // 10. 새 태그 삽입 (생성된 태그들을 note_tags 테이블에 삽입)
    if (limitedTags.length > 0) {
      await db
        .insert(noteTags)
        .values(
          limitedTags.map(tag => ({
            noteId,
            tag: tag.trim(),
          }))
        )
    }

    // 11. 토큰 사용량 기록
    try {
      const inputTokens = estimateTokenCount(prompt)
      const outputTokens = estimateTokenCount(tagsText)
      
      await recordTokenUsage({
        userId: user.id,
        noteId,
        operationType: 'tags',
        inputTokens,
        outputTokens,
        model: DEFAULT_GEMINI_MODEL,
      })
    } catch (tokenError) {
      console.error('토큰 사용량 기록 실패:', tokenError)
      // 토큰 기록 실패는 태그 생성 성공에 영향을 주지 않음
    }

    // 12. 성공 응답 반환
    return {
      success: true,
      tags: limitedTags,
    }
  } catch (error) {
    console.error('태그 생성 실패:', error)
    
    const aiError: AIError = {
      type: 'UNKNOWN_ERROR' as AIErrorType,
      message: '태그 생성에 실패했습니다. 다시 시도해주세요.',
      originalError: error,
      action: 'retry',
    }
    
    return {
      success: false,
      error: '태그 생성에 실패했습니다. 다시 시도해주세요.',
      aiError,
    }
  }
}

/**
 * AI 응답에서 태그 추출 및 정리
 * @param response - AI 응답 텍스트
 * @returns 정리된 태그 배열
 */
function parseTagsFromResponse(response: string): string[] {
  try {
    // 쉼표로 분리
    const rawTags = response.split(',').map(tag => tag.trim())
    
    // 빈 문자열 제거 및 길이 제한 (최대 50자)
    const cleanedTags = rawTags
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .map(tag => tag.replace(/^[-•\*\s]+/, '').trim()) // 불릿 포인트 제거
      .filter(tag => tag.length > 0)
    
    return cleanedTags
  } catch (error) {
    console.error('태그 파싱 실패:', error)
    return []
  }
}

/**
 * 노트의 태그 조회
 * @param noteId - 조회할 노트 ID
 * @returns 성공 여부, 태그 목록 또는 에러 메시지
 */
export async function getTags(
  noteId: string
): Promise<{
  success: boolean
  tags?: string[]
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

    // 4. 태그 조회
    const tags = await db
      .select({ tag: noteTags.tag })
      .from(noteTags)
      .where(eq(noteTags.noteId, noteId))

    return {
      success: true,
      tags: Array.isArray(tags) ? tags.map(t => t.tag) : [],
    }
  } catch (error) {
    console.error('태그 조회 실패:', error)
    return {
      success: false,
      error: '태그 조회에 실패했습니다.',
    }
  }
}

/**
 * 노트의 태그 삭제
 * @param noteId - 태그를 삭제할 노트 ID
 * @returns 성공 여부 또는 에러 메시지
 */
export async function deleteTags(
  noteId: string
): Promise<{
  success: boolean
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

    // 4. 태그 삭제
    await db
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId))

    return {
      success: true,
    }
  } catch (error) {
    console.error('태그 삭제 실패:', error)
    return {
      success: false,
      error: '태그 삭제에 실패했습니다.',
    }
  }
}

/**
 * 태그 목록 업데이트
 * @param noteId - 업데이트할 노트 ID
 * @param tags - 새로운 태그 목록
 * @returns 성공 여부, 업데이트된 태그 목록 또는 에러 메시지
 */
export async function updateTags(
  noteId: string,
  tags: string[]
): Promise<{
  success: boolean
  tags?: string[]
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

    // 2. 입력 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효한 노트 ID가 필요합니다.',
      }
    }

    if (!Array.isArray(tags)) {
      return {
        success: false,
        error: '태그 목록이 올바르지 않습니다.',
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

    // 4. 태그 정리 및 유효성 검사
    const validTags = tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim())
      .filter(tag => tag.length <= 50) // 최대 50자
      .slice(0, MAX_TAGS_COUNT) // 최대 6개

    // 5. 기존 태그 삭제
    await db
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId))

    // 6. 새 태그 삽입
    if (validTags.length > 0) {
      await db
        .insert(noteTags)
        .values(
          validTags.map(tag => ({
            noteId,
            tag,
          }))
        )
    }

    return {
      success: true,
      tags: validTags,
    }
  } catch (error) {
    console.error('태그 업데이트 실패:', error)
    return {
      success: false,
      error: '태그 업데이트에 실패했습니다.',
    }
  }
}

/**
 * 개별 태그 추가
 * @param noteId - 태그를 추가할 노트 ID
 * @param tag - 추가할 태그
 * @returns 성공 여부, 업데이트된 태그 목록 또는 에러 메시지
 */
export async function addTag(
  noteId: string,
  tag: string
): Promise<{
  success: boolean
  tags?: string[]
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

    // 2. 입력 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효한 노트 ID가 필요합니다.',
      }
    }

    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return {
        success: false,
        error: '태그를 입력해주세요.',
      }
    }

    const trimmedTag = tag.trim()
    if (trimmedTag.length > 50) {
      return {
        success: false,
        error: '태그는 최대 50자까지 입력할 수 있습니다.',
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

    // 4. 기존 태그 조회
    const existingTags = await db
      .select({ tag: noteTags.tag })
      .from(noteTags)
      .where(eq(noteTags.noteId, noteId))

    const currentTags = existingTags.map(t => t.tag)

    // 5. 중복 태그 확인
    if (currentTags.includes(trimmedTag)) {
      return {
        success: false,
        error: '이미 존재하는 태그입니다.',
      }
    }

    // 6. 태그 개수 제한 확인
    if (currentTags.length >= MAX_TAGS_COUNT) {
      return {
        success: false,
        error: `최대 ${MAX_TAGS_COUNT}개의 태그만 추가할 수 있습니다.`,
      }
    }

    // 7. 새 태그 추가
    await db
      .insert(noteTags)
      .values({
        noteId,
        tag: trimmedTag,
      })

    return {
      success: true,
      tags: [...currentTags, trimmedTag],
    }
  } catch (error) {
    console.error('태그 추가 실패:', error)
    return {
      success: false,
      error: '태그 추가에 실패했습니다.',
    }
  }
}

/**
 * 개별 태그 삭제
 * @param noteId - 태그를 삭제할 노트 ID
 * @param tag - 삭제할 태그
 * @returns 성공 여부, 업데이트된 태그 목록 또는 에러 메시지
 */
export async function removeTag(
  noteId: string,
  tag: string
): Promise<{
  success: boolean
  tags?: string[]
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

    // 2. 입력 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효한 노트 ID가 필요합니다.',
      }
    }

    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return {
        success: false,
        error: '삭제할 태그를 지정해주세요.',
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

    // 4. 태그 삭제
    await db
      .delete(noteTags)
      .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tag, tag.trim())))

    // 5. 남은 태그 조회
    const remainingTags = await db
      .select({ tag: noteTags.tag })
      .from(noteTags)
      .where(eq(noteTags.noteId, noteId))

    return {
      success: true,
      tags: remainingTags.map(t => t.tag),
    }
  } catch (error) {
    console.error('태그 삭제 실패:', error)
    return {
      success: false,
      error: '태그 삭제에 실패했습니다.',
    }
  }
}
