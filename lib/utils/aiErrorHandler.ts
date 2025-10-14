// lib/utils/aiErrorHandler.ts
// AI 에러 핸들러 유틸리티
// Gemini API 에러 분석 및 사용자 친화적 메시지 생성
// 관련 파일: lib/types/ai.ts, lib/gemini/generateText.ts

import { AIError, AIErrorType, AI_ERROR_MESSAGES } from '@/lib/types/ai'

/**
 * AI 에러 분석 및 처리
 * @param error - 발생한 에러 객체
 * @returns AIError 객체 (타입, 메시지, 추천 액션 포함)
 */
export function handleAIError(error: any): AIError {
  // 타임아웃 에러
  if (error.message?.includes('Timeout') || error.message?.includes('timeout')) {
    return {
      type: AIErrorType.TIMEOUT,
      message: AI_ERROR_MESSAGES[AIErrorType.TIMEOUT],
      originalError: error,
      action: 'retry',
    }
  }

  // API 키 누락 에러
  if (error.message?.includes('API key') || error.message?.includes('GEMINI_API_KEY')) {
    return {
      type: AIErrorType.API_KEY_MISSING,
      message: AI_ERROR_MESSAGES[AIErrorType.API_KEY_MISSING],
      originalError: error,
      action: 'check-key',
    }
  }

  // Gemini API 에러 (status code 기반)
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode

    // 할당량 초과 (429)
    if (status === 429) {
      return {
        type: AIErrorType.QUOTA_EXCEEDED,
        message: AI_ERROR_MESSAGES[AIErrorType.QUOTA_EXCEEDED],
        originalError: error,
        action: 'wait',
      }
    }

    // 잘못된 요청 (400, 401, 403)
    if (status >= 400 && status < 500) {
      return {
        type: AIErrorType.INVALID_REQUEST,
        message: AI_ERROR_MESSAGES[AIErrorType.INVALID_REQUEST],
        originalError: error,
        action: 'check-key',
      }
    }

    // 서버 에러 (500+)
    if (status >= 500) {
      return {
        type: AIErrorType.SERVER_ERROR,
        message: AI_ERROR_MESSAGES[AIErrorType.SERVER_ERROR],
        originalError: error,
        action: 'retry',
      }
    }
  }

  // Gemini API 에러 메시지 기반
  if (error.message) {
    // 할당량 초과
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return {
        type: AIErrorType.QUOTA_EXCEEDED,
        message: AI_ERROR_MESSAGES[AIErrorType.QUOTA_EXCEEDED],
        originalError: error,
        action: 'wait',
      }
    }

    // 인증 실패
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return {
        type: AIErrorType.API_KEY_MISSING,
        message: AI_ERROR_MESSAGES[AIErrorType.API_KEY_MISSING],
        originalError: error,
        action: 'check-key',
      }
    }

    // 잘못된 요청
    if (error.message.includes('invalid') || error.message.includes('bad request')) {
      return {
        type: AIErrorType.INVALID_REQUEST,
        message: AI_ERROR_MESSAGES[AIErrorType.INVALID_REQUEST],
        originalError: error,
        action: 'retry',
      }
    }
  }

  // 기본 에러
  return {
    type: AIErrorType.UNKNOWN_ERROR,
    message: error.message || AI_ERROR_MESSAGES[AIErrorType.UNKNOWN_ERROR],
    originalError: error,
    action: 'contact-support',
  }
}

/**
 * 에러 타입에 따른 추천 액션 반환
 * @param errorType - AI 에러 타입
 * @returns 액션 레이블과 액션 타입
 */
export function getAIErrorAction(errorType: AIErrorType): {
  label: string
  action: string
} {
  switch (errorType) {
    case AIErrorType.API_KEY_MISSING:
      return { label: 'API 키 확인', action: 'check-key' }
    case AIErrorType.QUOTA_EXCEEDED:
      return { label: '잠시 후 재시도', action: 'wait' }
    case AIErrorType.TIMEOUT:
    case AIErrorType.INVALID_REQUEST:
    case AIErrorType.SERVER_ERROR:
      return { label: '다시 시도', action: 'retry' }
    default:
      return { label: '지원팀 문의', action: 'contact-support' }
  }
}

/**
 * 사용자 친화적 메시지 포맷팅
 * @param error - AIError 객체
 * @returns 포맷된 에러 메시지
 */
export function formatAIErrorMessage(error: AIError): string {
  return error.message
}

