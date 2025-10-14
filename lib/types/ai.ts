// lib/types/ai.ts
// AI 에러 타입 정의
// Gemini API 에러 처리를 위한 타입 및 상수
// 관련 파일: lib/utils/aiErrorHandler.ts, lib/gemini/generateText.ts

/**
 * AI 에러 타입 enum
 */
export enum AIErrorType {
  API_KEY_MISSING = 'API_KEY_MISSING',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
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
  originalError?: any
  action?: 'retry' | 'check-key' | 'wait' | 'contact-support'
}

/**
 * AI 에러 메시지 상수
 */
export const AI_ERROR_MESSAGES: Record<AIErrorType, string> = {
  [AIErrorType.API_KEY_MISSING]: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.',
  [AIErrorType.QUOTA_EXCEEDED]: 'AI 처리 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  [AIErrorType.TIMEOUT]: 'AI 처리 시간이 초과되었습니다. 다시 시도해주세요.',
  [AIErrorType.INVALID_REQUEST]: '잘못된 요청입니다. 입력 내용을 확인해주세요.',
  [AIErrorType.SERVER_ERROR]: 'AI 서버에 일시적인 문제가 발생했습니다.',
  [AIErrorType.UNKNOWN_ERROR]: 'AI 처리 중 알 수 없는 오류가 발생했습니다.',
}

