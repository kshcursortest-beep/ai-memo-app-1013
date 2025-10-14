// lib/utils/errorHandler.ts
// 에러 핸들러 유틸리티
// 에러 타입 분석 및 사용자 친화적 메시지 생성
// 관련 파일: lib/types/errors.ts, app/actions/auth.ts

import { AuthError, AuthErrorType, ERROR_MESSAGES } from '@/lib/types/errors'

/**
 * 인증 에러 분석 및 처리
 */
export function handleAuthError(error: any): AuthError {
  // 네트워크 에러
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES[AuthErrorType.NETWORK_ERROR],
      originalError: error,
      action: 'retry',
    }
  }

  // Supabase Auth 에러
  if (error.message) {
    // 세션 만료
    if (error.message.includes('Session') || error.message.includes('expired')) {
      return {
        type: AuthErrorType.SESSION_EXPIRED,
        message: ERROR_MESSAGES[AuthErrorType.SESSION_EXPIRED],
        originalError: error,
        action: 'login',
      }
    }

    // 이메일 미확인
    if (error.message.includes('Email not confirmed')) {
      return {
        type: AuthErrorType.EMAIL_NOT_CONFIRMED,
        message: ERROR_MESSAGES[AuthErrorType.EMAIL_NOT_CONFIRMED],
        originalError: error,
        action: 'resend-email',
      }
    }

    // 인증 실패
    if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email')) {
      return {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES[AuthErrorType.INVALID_CREDENTIALS],
        originalError: error,
        action: 'retry',
      }
    }

    // 권한 에러
    if (error.message.includes('Permission') || error.message.includes('403')) {
      return {
        type: AuthErrorType.PERMISSION_DENIED,
        message: ERROR_MESSAGES[AuthErrorType.PERMISSION_DENIED],
        originalError: error,
        action: 'go-home',
      }
    }
  }

  // HTTP 상태 코드 기반 에러
  if (error.status) {
    if (error.status >= 500) {
      return {
        type: AuthErrorType.SERVER_ERROR,
        message: ERROR_MESSAGES[AuthErrorType.SERVER_ERROR],
        originalError: error,
        action: 'retry',
      }
    }

    if (error.status >= 400 && error.status < 500) {
      return {
        type: AuthErrorType.CLIENT_ERROR,
        message: ERROR_MESSAGES[AuthErrorType.CLIENT_ERROR],
        originalError: error,
        action: 'retry',
      }
    }
  }

  // 기본 에러
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: error.message || ERROR_MESSAGES[AuthErrorType.UNKNOWN_ERROR],
    originalError: error,
    action: 'retry',
  }
}

/**
 * 에러에 따른 추천 액션 반환
 */
export function getErrorAction(errorType: AuthErrorType): {
  label: string
  action: string
} {
  switch (errorType) {
    case AuthErrorType.NETWORK_ERROR:
    case AuthErrorType.SERVER_ERROR:
      return { label: '다시 시도', action: 'retry' }
    case AuthErrorType.SESSION_EXPIRED:
    case AuthErrorType.INVALID_CREDENTIALS:
      return { label: '로그인', action: 'login' }
    case AuthErrorType.EMAIL_NOT_CONFIRMED:
      return { label: '이메일 재전송', action: 'resend-email' }
    case AuthErrorType.PERMISSION_DENIED:
      return { label: '홈으로', action: 'go-home' }
    default:
      return { label: '다시 시도', action: 'retry' }
  }
}

/**
 * 사용자 친화적 메시지 포맷팅
 */
export function formatErrorMessage(error: AuthError): string {
  return error.message
}


