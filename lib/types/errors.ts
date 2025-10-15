// lib/types/errors.ts
// 에러 타입 정의
// 인증 관련 에러 분류 및 타입 정의
// 관련 파일: lib/utils/errorHandler.ts

export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AuthError {
  type: AuthErrorType
  message: string
  originalError?: unknown
  action?: string
}

export const ERROR_MESSAGES: Record<AuthErrorType, string> = {
  [AuthErrorType.NETWORK_ERROR]: '인터넷 연결을 확인해주세요.',
  [AuthErrorType.SERVER_ERROR]: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [AuthErrorType.CLIENT_ERROR]: '요청 처리 중 오류가 발생했습니다.',
  [AuthErrorType.VALIDATION_ERROR]: '입력하신 정보를 다시 확인해주세요.',
  [AuthErrorType.SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [AuthErrorType.PERMISSION_DENIED]: '접근 권한이 없습니다.',
  [AuthErrorType.EMAIL_NOT_CONFIRMED]: '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
  [AuthErrorType.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [AuthErrorType.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
}



