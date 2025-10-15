// app/actions/token-usage.ts
// 토큰 사용량 관련 Server Actions
// AI 요청별 토큰 사용량 기록, 조회, 통계 기능 제공
// 관련 파일: drizzle/schema.ts, lib/utils/token-calculator.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { tokenUsage } from '@/drizzle/schema'
import { eq, and, gte, lte, sum, count, desc } from 'drizzle-orm'

export type TokenOperationType = 'summary' | 'tags' | 'regeneration'

/**
 * 토큰 사용량 기록
 * @param noteId - 노트 ID
 * @param operationType - 작업 타입
 * @param inputTokens - 입력 토큰 수
 * @param outputTokens - 출력 토큰 수
 * @param model - 사용된 AI 모델
 * @returns 성공 여부 또는 에러 메시지
 */
export async function recordTokenUsage(
  noteId: string,
  operationType: TokenOperationType,
  inputTokens: number,
  outputTokens: number,
  model: string
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

    // 2. 입력 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효한 노트 ID가 필요합니다.',
      }
    }

    if (!operationType || !['summary', 'tags', 'regeneration'].includes(operationType)) {
      return {
        success: false,
        error: '유효한 작업 타입이 필요합니다.',
      }
    }

    if (typeof inputTokens !== 'number' || inputTokens < 0) {
      return {
        success: false,
        error: '유효한 입력 토큰 수가 필요합니다.',
      }
    }

    if (typeof outputTokens !== 'number' || outputTokens < 0) {
      return {
        success: false,
        error: '유효한 출력 토큰 수가 필요합니다.',
      }
    }

    if (!model || typeof model !== 'string') {
      return {
        success: false,
        error: '유효한 모델명이 필요합니다.',
      }
    }

    // 3. 토큰 사용량 계산
    const totalTokens = inputTokens + outputTokens
    const costUsd = calculateTokenCost(inputTokens, outputTokens, model)

    // 4. 토큰 사용량 기록
    await db.insert(tokenUsage).values({
      userId: user.id,
      noteId,
      operationType,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd: costUsd.toString(),
      model,
    })

    return { success: true }
  } catch (error) {
    console.error('토큰 사용량 기록 실패:', error)
    return {
      success: false,
      error: '토큰 사용량 기록에 실패했습니다.',
    }
  }
}

/**
 * 사용자 토큰 사용량 조회
 * @param period - 조회 기간 ('today', 'week', 'month', 'year')
 * @returns 성공 여부, 사용량 통계 또는 에러 메시지
 */
export async function getTokenUsage(
  period: 'today' | 'week' | 'month' | 'year' = 'today'
): Promise<{
  success: boolean
  usage?: {
    totalTokens: number
    totalCost: number
    operationCounts: Record<TokenOperationType, number>
    dailyUsage: Array<{ date: string; tokens: number; cost: number }>
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

    // 2. 기간별 날짜 범위 계산
    const { startDate, endDate } = getDateRange(period)

    // 3. 토큰 사용량 집계
    const usageStats = await db
      .select({
        totalTokens: sum(tokenUsage.totalTokens),
        totalCost: sum(tokenUsage.costUsd),
        operationType: tokenUsage.operationType,
        count: count(),
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, user.id),
          gte(tokenUsage.createdAt, startDate),
          lte(tokenUsage.createdAt, endDate)
        )
      )
      .groupBy(tokenUsage.operationType)

    // 4. 일별 사용량 조회
    const dailyUsage = await db
      .select({
        date: tokenUsage.createdAt,
        tokens: sum(tokenUsage.totalTokens),
        cost: sum(tokenUsage.costUsd),
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, user.id),
          gte(tokenUsage.createdAt, startDate),
          lte(tokenUsage.createdAt, endDate)
        )
      )
      .groupBy(tokenUsage.createdAt)
      .orderBy(desc(tokenUsage.createdAt))

    // 5. 결과 정리
    const totalTokens = usageStats.reduce((sum, stat) => sum + (Number(stat.totalTokens) || 0), 0)
    const totalCost = usageStats.reduce((sum, stat) => sum + (Number(stat.totalCost) || 0), 0)
    
    const operationCounts: Record<TokenOperationType, number> = {
      summary: 0,
      tags: 0,
      regeneration: 0,
    }

    usageStats.forEach(stat => {
      if (stat.operationType in operationCounts) {
        operationCounts[stat.operationType as TokenOperationType] = Number(stat.count) || 0
      }
    })

    return {
      success: true,
      usage: {
        totalTokens,
        totalCost,
        operationCounts,
        dailyUsage: dailyUsage.map(day => ({
          date: day.date.toISOString().split('T')[0],
          tokens: Number(day.tokens) || 0,
          cost: Number(day.cost) || 0,
        })),
      },
    }
  } catch (error) {
    console.error('토큰 사용량 조회 실패:', error)
    return {
      success: false,
      error: '토큰 사용량 조회에 실패했습니다.',
    }
  }
}

/**
 * 토큰 사용량 통계 조회
 * @returns 성공 여부, 통계 정보 또는 에러 메시지
 */
export async function getTokenUsageStats(): Promise<{
  success: boolean
  stats?: {
    todayUsage: number
    weekUsage: number
    monthUsage: number
    totalCost: number
    averageTokensPerRequest: number
    mostUsedOperation: TokenOperationType
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

    // 2. 오늘 사용량
    const todayResult = await getTokenUsage('today')
    const todayUsage = todayResult.success ? (todayResult.usage?.totalTokens || 0) : 0

    // 3. 이번 주 사용량
    const weekResult = await getTokenUsage('week')
    const weekUsage = weekResult.success ? (weekResult.usage?.totalTokens || 0) : 0

    // 4. 이번 달 사용량
    const monthResult = await getTokenUsage('month')
    const monthUsage = monthResult.success ? (monthResult.usage?.totalTokens || 0) : 0
    const totalCost = monthResult.success ? (monthResult.usage?.totalCost || 0) : 0

    // 5. 평균 토큰 수 및 가장 많이 사용된 작업
    const operationCounts = monthResult.success ? monthResult.usage?.operationCounts : null
    const totalRequests = operationCounts ? Object.values(operationCounts).reduce((sum, count) => sum + count, 0) : 0
    const averageTokensPerRequest = totalRequests > 0 ? monthUsage / totalRequests : 0

    const mostUsedOperation = operationCounts ? 
      Object.entries(operationCounts).reduce((max, [operation, count]) => 
        count > max.count ? { operation: operation as TokenOperationType, count } : max,
        { operation: 'summary' as TokenOperationType, count: 0 }
      ).operation : 'summary'

    return {
      success: true,
      stats: {
        todayUsage,
        weekUsage,
        monthUsage,
        totalCost,
        averageTokensPerRequest,
        mostUsedOperation,
      },
    }
  } catch (error) {
    console.error('토큰 사용량 통계 조회 실패:', error)
    return {
      success: false,
      error: '토큰 사용량 통계 조회에 실패했습니다.',
    }
  }
}

/**
 * 토큰 사용량 제한 확인
 * @param operationType - 작업 타입
 * @returns 성공 여부, 제한 정보 또는 에러 메시지
 */
export async function checkTokenLimit(
  operationType: TokenOperationType
): Promise<{
  success: boolean
  limit?: {
    canUse: boolean
    currentUsage: number
    limit: number
    remaining: number
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

    // 2. 일일 토큰 제한 설정 (예: 100,000 토큰)
    const dailyLimit = 100000

    // 3. 오늘 사용량 조회
    const todayResult = await getTokenUsage('today')
    const currentUsage = todayResult.success ? (todayResult.usage?.totalTokens || 0) : 0

    // 4. 제한 확인
    const canUse = currentUsage < dailyLimit
    const remaining = Math.max(0, dailyLimit - currentUsage)

    return {
      success: true,
      limit: {
        canUse,
        currentUsage,
        limit: dailyLimit,
        remaining,
      },
    }
  } catch (error) {
    console.error('토큰 제한 확인 실패:', error)
    return {
      success: false,
      error: '토큰 제한 확인에 실패했습니다.',
    }
  }
}

/**
 * 토큰 비용 계산 (Gemini API 기준)
 * @param inputTokens - 입력 토큰 수
 * @param outputTokens - 출력 토큰 수
 * @param model - AI 모델
 * @returns 비용 (USD)
 */
function calculateTokenCost(inputTokens: number, outputTokens: number, model: string): number {
  // Gemini 1.5 Flash 가격 (2024년 기준)
  const INPUT_COST_PER_1K = 0.000075 // $0.075 per 1M tokens
  const OUTPUT_COST_PER_1K = 0.0003 // $0.30 per 1M tokens

  const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K
  const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K

  return inputCost + outputCost
}

/**
 * 사용자의 현재 일일 토큰 사용량이 제한을 초과하는지 확인합니다.
 * @param userId - 사용자 ID
 * @returns 제한 초과 여부, 현재 사용량, 제한
 */
export async function checkDailyTokenLimit(
  userId: string
): Promise<{
  isExceeded: boolean
  currentUsage: number
  limit: number
  error?: string
}> {
  try {
    const dailyUsage = (await getTokenUsage('today')).usage
    const currentUsage = dailyUsage?.totalTokens || 0

    return {
      isExceeded: currentUsage >= DAILY_TOKEN_LIMIT,
      currentUsage,
      limit: DAILY_TOKEN_LIMIT,
    }
  } catch (error) {
    console.error('일일 토큰 제한 확인 실패:', error)
    return { 
      isExceeded: true, 
      currentUsage: 0, 
      limit: DAILY_TOKEN_LIMIT,
      error: '일일 토큰 제한 확인에 실패했습니다.'
    }
  }
}

/**
 * 기간별 날짜 범위 계산
 * @param period - 기간
 * @returns 시작일과 종료일
 */
function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { startDate: Date; endDate: Date } {
  const now = new Date()
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  let startDate: Date

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  }

  return { startDate, endDate }
}
