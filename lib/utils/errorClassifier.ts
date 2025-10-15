// lib/utils/errorClassifier.ts
// AI 에러 분류 유틸리티
// 다양한 에러 타입을 분류하고 적절한 처리 방법을 제공
// 관련 파일: lib/types/ai.ts, lib/utils/aiErrorHandler.ts

import { AIErrorType, type AIError } from '@/lib/types/ai'

/**
 * 에러 객체를 분석하여 AI 에러 타입을 분류
 * @param error - 분석할 에러 객체
 * @returns 분류된 AI 에러 정보
 */
export function classifyError(error: unknown): AIError {
  // 에러가 없는 경우
  if (!error) {
    return {
      type: AIErrorType.UNKNOWN_ERROR,
      message: '알 수 없는 오류가 발생했습니다.',
      originalError: error,
      action: 'contact-support',
    }
  }

  // 에러 메시지 추출
  const errorMessage = getErrorMessage(error)
  const errorString = errorMessage.toLowerCase()

  // 네트워크 관련 에러
  if (
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('connection') ||
    errorString.includes('timeout') ||
    errorString.includes('dns') ||
    errorString.includes('enotfound') ||
    errorString.includes('econnrefused')
  ) {
    return {
      type: AIErrorType.NETWORK,
      message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
      originalError: error,
      action: 'retry',
    }
  }

  // API 키 관련 에러
  if (
    errorString.includes('api key') ||
    errorString.includes('apikey') ||
    errorString.includes('unauthorized') ||
    errorString.includes('401') ||
    errorString.includes('forbidden') ||
    errorString.includes('403')
  ) {
    return {
      type: AIErrorType.API_KEY_MISSING,
      message: 'API 키에 문제가 있습니다. 관리자에게 문의해주세요.',
      originalError: error,
      action: 'check-key',
    }
  }

  // 할당량 초과 에러
  if (
    errorString.includes('quota') ||
    errorString.includes('limit') ||
    errorString.includes('rate limit') ||
    errorString.includes('429') ||
    errorString.includes('too many requests')
  ) {
    return {
      type: AIErrorType.QUOTA_EXCEEDED,
      message: 'AI 처리 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      originalError: error,
      action: 'wait',
    }
  }

  // 토큰 제한 에러
  if (
    errorString.includes('token') ||
    errorString.includes('length') ||
    errorString.includes('too long') ||
    errorString.includes('max tokens')
  ) {
    return {
      type: AIErrorType.VALIDATION,
      message: '입력 내용이 너무 깁니다. 내용을 줄이거나 나누어 처리해주세요.',
      originalError: error,
      action: 'retry',
    }
  }

  // 타임아웃 에러
  if (
    errorString.includes('timeout') ||
    errorString.includes('timed out') ||
    errorString.includes('etimedout')
  ) {
    return {
      type: AIErrorType.TIMEOUT,
      message: 'AI 처리 시간이 초과되었습니다. 다시 시도해주세요.',
      originalError: error,
      action: 'retry',
    }
  }

  // 서버 에러 (5xx)
  if (
    errorString.includes('500') ||
    errorString.includes('502') ||
    errorString.includes('503') ||
    errorString.includes('504') ||
    errorString.includes('internal server error') ||
    errorString.includes('bad gateway') ||
    errorString.includes('service unavailable')
  ) {
    return {
      type: AIErrorType.SERVER_ERROR,
      message: 'AI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      originalError: error,
      action: 'retry',
    }
  }

  // 클라이언트 에러 (4xx)
  if (
    errorString.includes('400') ||
    errorString.includes('404') ||
    errorString.includes('bad request') ||
    errorString.includes('not found')
  ) {
    return {
      type: AIErrorType.INVALID_REQUEST,
      message: '잘못된 요청입니다. 입력 내용을 확인해주세요.',
      originalError: error,
      action: 'retry',
    }
  }

  // API 에러 (일반적인 API 관련 에러)
  if (
    errorString.includes('api') ||
    errorString.includes('service') ||
    errorString.includes('endpoint')
  ) {
    return {
      type: AIErrorType.API,
      message: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      originalError: error,
      action: 'retry',
    }
  }

  // 기본값: 알 수 없는 에러
  return {
    type: AIErrorType.UNKNOWN_ERROR,
    message: 'AI 처리 중 알 수 없는 오류가 발생했습니다.',
    originalError: error,
    action: 'contact-support',
  }
}

/**
 * 에러 객체에서 메시지 추출
 * @param error - 에러 객체
 * @returns 에러 메시지 문자열
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    // Error 객체
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }

    // Axios 에러
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as any
      if (response.data && typeof response.data === 'object') {
        if ('message' in response.data && typeof response.data.message === 'string') {
          return response.data.message
        }
        if ('error' in response.data && typeof response.data.error === 'string') {
          return response.data.error
        }
      }
      if ('statusText' in response && typeof response.statusText === 'string') {
        return response.statusText
      }
    }

    // Fetch 에러
    if ('status' in error && typeof error.status === 'number') {
      return `HTTP ${error.status}`
    }

    // 기타 객체를 문자열로 변환
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }

  return String(error)
}

/**
 * 에러 타입에 따른 권장 액션 반환
 * @param errorType - AI 에러 타입
 * @returns 권장 액션 문자열
 */
export function getRecommendedAction(errorType: AIErrorType): string {
  switch (errorType) {
    case AIErrorType.NETWORK:
      return '인터넷 연결을 확인하고 다시 시도해주세요.'
    case AIErrorType.API_KEY_MISSING:
      return '관리자에게 문의하여 API 키를 확인해주세요.'
    case AIErrorType.QUOTA_EXCEEDED:
      return '잠시 후 다시 시도하거나 사용량을 줄여주세요.'
    case AIErrorType.VALIDATION:
      return '입력 내용을 확인하고 다시 시도해주세요.'
    case AIErrorType.TIMEOUT:
      return '잠시 후 다시 시도해주세요.'
    case AIErrorType.SERVER_ERROR:
      return '서버가 복구될 때까지 잠시 기다려주세요.'
    case AIErrorType.INVALID_REQUEST:
      return '요청 내용을 확인하고 다시 시도해주세요.'
    case AIErrorType.API:
      return 'AI 서비스가 복구될 때까지 잠시 기다려주세요.'
    case AIErrorType.UNKNOWN_ERROR:
    default:
      return '문제가 지속되면 관리자에게 문의해주세요.'
  }
}

/**
 * 에러가 재시도 가능한지 확인
 * @param errorType - AI 에러 타입
 * @returns 재시도 가능 여부
 */
export function isRetryableError(errorType: AIErrorType): boolean {
  const retryableTypes = [
    AIErrorType.NETWORK,
    AIErrorType.TIMEOUT,
    AIErrorType.SERVER_ERROR,
    AIErrorType.API,
    AIErrorType.QUOTA_EXCEEDED,
  ]

  return retryableTypes.includes(errorType)
}

/**
 * 에러가 사용자 액션이 필요한지 확인
 * @param errorType - AI 에러 타입
 * @returns 사용자 액션 필요 여부
 */
export function requiresUserAction(errorType: AIErrorType): boolean {
  const userActionTypes = [
    AIErrorType.API_KEY_MISSING,
    AIErrorType.VALIDATION,
    AIErrorType.INVALID_REQUEST,
  ]

  return userActionTypes.includes(errorType)
}
