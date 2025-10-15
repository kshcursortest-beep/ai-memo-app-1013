// app/actions/regenerations.ts
// AI 재생성 관련 Server Actions
// 재생성 횟수 제한 및 기록 관리
// 관련 파일: drizzle/schema.ts, lib/db.ts, lib/supabase/server.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { aiRegenerations } from '@/drizzle/schema'
import { eq, and, gte, count } from 'drizzle-orm'

/**
 * 재생성 타입 정의
 */
export type RegenerationType = 'summary' | 'tags'

/**
 * 재생성 제한 설정
 */
const REGENERATION_LIMITS = {
  summary: 10, // 하루 요약 재생성 최대 10회
  tags: 10,    // 하루 태그 재생성 최대 10회
} as const

/**
 * 사용자의 일일 재생성 횟수 확인
 * @param userId - 사용자 ID
 * @param type - 재생성 타입 ('summary' 또는 'tags')
 * @returns 재생성 가능 여부와 현재 사용량
 */
export async function checkRegenerationLimit(
  userId: string,
  type: RegenerationType
): Promise<{
  canRegenerate: boolean
  currentCount: number
  limit: number
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        canRegenerate: false,
        currentCount: 0,
        limit: REGENERATION_LIMITS[type],
        error: '인증이 필요합니다.',
      }
    }

    // 2. 오늘 날짜 기준으로 재생성 횟수 조회
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [result] = await db
      .select({ count: count() })
      .from(aiRegenerations)
      .where(
        and(
          eq(aiRegenerations.userId, userId),
          eq(aiRegenerations.type, type),
          gte(aiRegenerations.createdAt, today)
        )
      )

    const currentCount = result?.count || 0
    const limit = REGENERATION_LIMITS[type]
    const canRegenerate = currentCount < limit

    return {
      canRegenerate,
      currentCount,
      limit,
    }
  } catch (error) {
    console.error('재생성 횟수 확인 실패:', error)
    return {
      canRegenerate: false,
      currentCount: 0,
      limit: REGENERATION_LIMITS[type],
      error: '재생성 횟수 확인 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 재생성 기록 저장
 * @param userId - 사용자 ID
 * @param noteId - 노트 ID
 * @param type - 재생성 타입
 * @returns 성공 여부 및 에러 메시지
 */
export async function recordRegeneration(
  userId: string,
  noteId: string,
  type: RegenerationType
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      }
    }

    // 2. 재생성 기록 저장
    await db.insert(aiRegenerations).values({
      userId,
      noteId,
      type,
    })

    return { success: true }
  } catch (error) {
    console.error('재생성 기록 저장 실패:', error)
    return {
      success: false,
      error: '재생성 기록 저장 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 재생성 가능 여부 확인 및 기록 저장 (통합 함수)
 * @param noteId - 노트 ID
 * @param type - 재생성 타입
 * @returns 재생성 가능 여부 및 에러 메시지
 */
export async function canRegenerateAndRecord(
  noteId: string,
  type: RegenerationType
): Promise<{
  canRegenerate: boolean
  error?: string
  currentCount?: number
  limit?: number
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        canRegenerate: false,
        error: '인증이 필요합니다.',
      }
    }

    // 2. 재생성 횟수 확인
    const limitCheck = await checkRegenerationLimit(user.id, type)
    
    if (!limitCheck.canRegenerate) {
      return {
        canRegenerate: false,
        error: `일일 ${type === 'summary' ? '요약' : '태그'} 재생성 한도(${limitCheck.limit}회)를 초과했습니다. 내일 다시 시도해주세요.`,
        currentCount: limitCheck.currentCount,
        limit: limitCheck.limit,
      }
    }

    // 3. 재생성 기록 저장
    const recordResult = await recordRegeneration(user.id, noteId, type)
    
    if (!recordResult.success) {
      return {
        canRegenerate: false,
        error: recordResult.error,
      }
    }

    return {
      canRegenerate: true,
      currentCount: limitCheck.currentCount + 1,
      limit: limitCheck.limit,
    }
  } catch (error) {
    console.error('재생성 확인 및 기록 실패:', error)
    return {
      canRegenerate: false,
      error: '재생성 처리 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 사용자의 재생성 히스토리 조회
 * @param type - 재생성 타입 (선택사항)
 * @returns 재생성 히스토리 목록
 */
export async function getRegenerationHistory(
  type?: RegenerationType
): Promise<{
  success: boolean
  history?: Array<{
    id: string
    noteId: string
    type: RegenerationType
    createdAt: Date
  }>
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      }
    }

    // 2. 재생성 히스토리 조회
    const whereCondition = type 
      ? and(
          eq(aiRegenerations.userId, user.id),
          eq(aiRegenerations.type, type)
        )
      : eq(aiRegenerations.userId, user.id)

    const history = await db
      .select({
        id: aiRegenerations.id,
        noteId: aiRegenerations.noteId,
        type: aiRegenerations.type,
        createdAt: aiRegenerations.createdAt,
      })
      .from(aiRegenerations)
      .where(whereCondition)
      .orderBy(aiRegenerations.createdAt)

    return {
      success: true,
      history: history as Array<{
        id: string
        noteId: string
        type: RegenerationType
        createdAt: Date
      }>,
    }
  } catch (error) {
    console.error('재생성 히스토리 조회 실패:', error)
    return {
      success: false,
      error: '재생성 히스토리 조회 중 오류가 발생했습니다.',
    }
  }
}
