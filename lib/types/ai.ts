// lib/types/ai.ts
// AI 상태 및 에러 타입 정의
// AI 처리 상태 관리와 Gemini API 에러 처리를 위한 타입 및 상수
// 관련 파일: lib/utils/aiErrorHandler.ts, lib/gemini/generateText.ts, components/ui/loading.tsx, components/ui/error.tsx

/**
 * AI 처리 상태 타입
 */
export type AIStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * AI 에러 타입 enum
 */
export enum AIErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  API_KEY_MISSING = 'API_KEY_MISSING',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * AI 에러 인터페이스
 */
export interface AIError {
  type: AIErrorType
  message: string
  originalError?: unknown
  action?: 'retry' | 'check-key' | 'wait' | 'contact-support'
}

/**
 * AI 처리 단계 타입
 */
export type AIProcessStep = 'preparing' | 'generating' | 'saving' | 'complete'

/**
 * AI 처리 진행률 인터페이스
 */
export interface AIProgress {
  step: AIProcessStep
  percentage: number
  message: string
  estimatedTime?: number // 초 단위
}

/**
 * AI 상태 인터페이스
 */
export interface AIState {
  status: AIStatus
  progress?: AIProgress
  error?: AIError
  retryCount?: number
}

/**
 * AI 에러 메시지 상수
 */
export const AI_ERROR_MESSAGES: Record<AIErrorType, string> = {
  [AIErrorType.NETWORK]: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
  [AIErrorType.API]: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [AIErrorType.VALIDATION]: '입력 내용이 올바르지 않습니다. 내용을 확인해주세요.',
  [AIErrorType.TIMEOUT]: 'AI 처리 시간이 초과되었습니다. 다시 시도해주세요.',
  [AIErrorType.API_KEY_MISSING]: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.',
  [AIErrorType.QUOTA_EXCEEDED]: 'AI 처리 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  [AIErrorType.INVALID_REQUEST]: '잘못된 요청입니다. 입력 내용을 확인해주세요.',
  [AIErrorType.SERVER_ERROR]: 'AI 서버에 일시적인 문제가 발생했습니다.',
  [AIErrorType.UNKNOWN_ERROR]: 'AI 처리 중 알 수 없는 오류가 발생했습니다.',
}

/**
 * AI 처리 단계별 메시지 상수
 */
export const AI_PROCESS_MESSAGES: Record<AIProcessStep, string> = {
  preparing: 'AI 처리를 준비하고 있습니다...',
  generating: 'AI가 내용을 분석하고 있습니다...',
  saving: '결과를 저장하고 있습니다...',
  complete: '처리가 완료되었습니다.',
}

