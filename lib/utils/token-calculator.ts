// lib/utils/token-calculator.ts
// 토큰 수 계산 유틸리티
// 텍스트의 토큰 수를 추정하고 비용을 계산
// 관련 파일: app/actions/token-usage.ts, lib/gemini/client.ts

/**
 * 텍스트의 토큰 수 추정 (대략적인 계산)
 * 실제 토큰 수는 AI 모델마다 다르지만, 일반적인 추정치 제공
 * @param text - 토큰 수를 계산할 텍스트
 * @returns 추정 토큰 수
 */
export function estimateTokenCount(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  // 한국어와 영어를 고려한 토큰 수 추정
  // 한국어: 평균 1.5자당 1토큰
  // 영어: 평균 4자당 1토큰
  // 공백, 구두점 등도 고려

  const koreanChars = (text.match(/[가-힣]/g) || []).length
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length
  const otherChars = text.length - koreanChars - englishChars

  // 토큰 수 계산
  const koreanTokens = Math.ceil(koreanChars / 1.5)
  const englishTokens = Math.ceil(englishChars / 4)
  const otherTokens = Math.ceil(otherChars / 3)

  return koreanTokens + englishTokens + otherTokens
}

/**
 * 프롬프트의 토큰 수 추정
 * @param prompt - 프롬프트 텍스트
 * @returns 추정 토큰 수
 */
export function estimatePromptTokens(prompt: string): number {
  return estimateTokenCount(prompt)
}

/**
 * 응답의 토큰 수 추정
 * @param response - AI 응답 텍스트
 * @returns 추정 토큰 수
 */
export function estimateResponseTokens(response: string): number {
  return estimateTokenCount(response)
}

/**
 * Gemini API 토큰 비용 계산
 * @param inputTokens - 입력 토큰 수
 * @param outputTokens - 출력 토큰 수
 * @param model - 사용된 모델 (기본값: 'gemini-1.5-flash')
 * @returns 비용 (USD)
 */
export function calculateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'gemini-1.5-flash'
): number {
  // Gemini 1.5 Flash 가격 (2024년 12월 기준)
  const PRICING = {
    'gemini-1.5-flash': {
      input: 0.000075, // $0.075 per 1M tokens
      output: 0.0003,  // $0.30 per 1M tokens
    },
    'gemini-1.5-pro': {
      input: 0.00125,  // $1.25 per 1M tokens
      output: 0.005,   // $5.00 per 1M tokens
    },
    'gemini-1.0-pro': {
      input: 0.0005,   // $0.50 per 1M tokens
      output: 0.0015,  // $1.50 per 1M tokens
    },
  }

  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gemini-1.5-flash']

  const inputCost = (inputTokens / 1000000) * pricing.input
  const outputCost = (outputTokens / 1000000) * pricing.output

  return inputCost + outputCost
}

/**
 * 토큰 사용량을 사람이 읽기 쉬운 형태로 포맷
 * @param tokens - 토큰 수
 * @returns 포맷된 문자열
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens}`
  } else if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}K`
  } else {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
}

/**
 * 비용을 사람이 읽기 쉬운 형태로 포맷
 * @param cost - 비용 (USD)
 * @returns 포맷된 문자열
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(2)}m` // 밀리달러
  } else if (cost < 1) {
    return `$${(cost * 100).toFixed(2)}c` // 센트
  } else {
    return `$${cost.toFixed(2)}`
  }
}

/**
 * 토큰 사용량을 백분율로 변환
 * @param used - 사용된 토큰 수
 * @param limit - 제한 토큰 수
 * @returns 백분율 (0-100)
 */
export function calculateTokenUsagePercentage(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.max(0, (used / limit) * 100))
}

/**
 * 토큰 사용량 상태 확인
 * @param used - 사용된 토큰 수
 * @param limit - 제한 토큰 수
 * @returns 상태 정보
 */
export function getTokenUsageStatus(used: number, limit: number): {
  status: 'safe' | 'warning' | 'danger' | 'exceeded'
  percentage: number
  remaining: number
  message: string
} {
  const percentage = calculateTokenUsagePercentage(used, limit)
  const remaining = Math.max(0, limit - used)

  if (used >= limit) {
    return {
      status: 'exceeded',
      percentage: 100,
      remaining: 0,
      message: '토큰 사용량이 제한을 초과했습니다.',
    }
  } else if (percentage >= 90) {
    return {
      status: 'danger',
      percentage,
      remaining,
      message: '토큰 사용량이 거의 한계에 도달했습니다.',
    }
  } else if (percentage >= 75) {
    return {
      status: 'warning',
      percentage,
      remaining,
      message: '토큰 사용량이 높습니다.',
    }
  } else {
    return {
      status: 'safe',
      percentage,
      remaining,
      message: '토큰 사용량이 정상 범위입니다.',
    }
  }
}

/**
 * 일일 토큰 사용량 추천
 * @param currentUsage - 현재 사용량
 * @param limit - 제한량
 * @returns 추천 정보
 */
export function getTokenUsageRecommendation(
  currentUsage: number,
  limit: number
): {
  canUseMore: boolean
  recommendedLimit: number
  message: string
} {
  const status = getTokenUsageStatus(currentUsage, limit)
  const remaining = Math.max(0, limit - currentUsage)

  if (status.status === 'exceeded') {
    return {
      canUseMore: false,
      recommendedLimit: 0,
      message: '오늘은 더 이상 AI 기능을 사용할 수 없습니다.',
    }
  } else if (status.status === 'danger') {
    return {
      canUseMore: true,
      recommendedLimit: Math.floor(remaining * 0.5),
      message: '남은 토큰을 신중하게 사용하세요.',
    }
  } else if (status.status === 'warning') {
    return {
      canUseMore: true,
      recommendedLimit: Math.floor(remaining * 0.7),
      message: '적당한 수준의 AI 기능 사용을 권장합니다.',
    }
  } else {
    return {
      canUseMore: true,
      recommendedLimit: remaining,
      message: '자유롭게 AI 기능을 사용할 수 있습니다.',
    }
  }
}
