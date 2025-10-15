// lib/utils/errorMessages.ts
// AI 에러 메시지 상수 정의
// 에러 타입별 사용자 친화적인 메시지 제공
// 관련 파일: lib/types/ai.ts, lib/utils/errorClassifier.ts

import { AIErrorType } from '@/lib/types/ai'

/**
 * AI 에러 타입별 사용자 친화적인 메시지
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
 * AI 에러 타입별 상세 설명
 */
export const AI_ERROR_DESCRIPTIONS: Record<AIErrorType, string> = {
  [AIErrorType.NETWORK]: '인터넷 연결이 불안정하거나 서버에 접근할 수 없습니다.',
  [AIErrorType.API]: 'AI 서비스가 일시적으로 사용할 수 없는 상태입니다.',
  [AIErrorType.VALIDATION]: '입력한 내용이 AI 처리 요구사항을 충족하지 않습니다.',
  [AIErrorType.TIMEOUT]: 'AI 처리 시간이 예상보다 오래 걸리고 있습니다.',
  [AIErrorType.API_KEY_MISSING]: 'AI 서비스 인증에 필요한 키가 설정되지 않았습니다.',
  [AIErrorType.QUOTA_EXCEEDED]: '일일 또는 월간 AI 사용 한도에 도달했습니다.',
  [AIErrorType.INVALID_REQUEST]: '요청 형식이나 내용에 문제가 있습니다.',
  [AIErrorType.SERVER_ERROR]: 'AI 서버에서 내부 오류가 발생했습니다.',
  [AIErrorType.UNKNOWN_ERROR]: '예상치 못한 오류가 발생했습니다.',
}

/**
 * AI 에러 타입별 해결 방법
 */
export const AI_ERROR_SOLUTIONS: Record<AIErrorType, string[]> = {
  [AIErrorType.NETWORK]: [
    '인터넷 연결 상태를 확인해주세요.',
    'Wi-Fi 또는 모바일 데이터 연결을 다시 시도해주세요.',
    '방화벽이나 보안 프로그램이 차단하고 있는지 확인해주세요.',
    '잠시 후 다시 시도해주세요.',
  ],
  [AIErrorType.API]: [
    'AI 서비스가 복구될 때까지 잠시 기다려주세요.',
    '몇 분 후 다시 시도해주세요.',
    '문제가 지속되면 관리자에게 문의해주세요.',
  ],
  [AIErrorType.VALIDATION]: [
    '입력 내용의 길이를 확인해주세요.',
    '특수 문자나 이모지가 포함되어 있는지 확인해주세요.',
    '내용을 더 간단하게 작성해주세요.',
    '내용을 여러 부분으로 나누어 처리해주세요.',
  ],
  [AIErrorType.TIMEOUT]: [
    '잠시 후 다시 시도해주세요.',
    '입력 내용이 너무 긴 경우 줄여보세요.',
    '네트워크 연결 상태를 확인해주세요.',
  ],
  [AIErrorType.API_KEY_MISSING]: [
    '관리자에게 문의하여 API 키 설정을 확인해주세요.',
    '시스템 설정을 점검해주세요.',
  ],
  [AIErrorType.QUOTA_EXCEEDED]: [
    '내일 다시 시도해주세요.',
    '사용량을 줄여서 다시 시도해주세요.',
    '유료 플랜으로 업그레이드를 고려해주세요.',
  ],
  [AIErrorType.INVALID_REQUEST]: [
    '입력 내용을 다시 확인해주세요.',
    '요청 형식이 올바른지 확인해주세요.',
    '필수 정보가 누락되지 않았는지 확인해주세요.',
  ],
  [AIErrorType.SERVER_ERROR]: [
    'AI 서버가 복구될 때까지 잠시 기다려주세요.',
    '몇 분 후 다시 시도해주세요.',
    '문제가 지속되면 관리자에게 문의해주세요.',
  ],
  [AIErrorType.UNKNOWN_ERROR]: [
    '페이지를 새로고침해주세요.',
    '잠시 후 다시 시도해주세요.',
    '문제가 지속되면 관리자에게 문의해주세요.',
  ],
}

/**
 * AI 에러 타입별 아이콘 이름
 */
export const AI_ERROR_ICONS: Record<AIErrorType, string> = {
  [AIErrorType.NETWORK]: 'Wifi',
  [AIErrorType.API]: 'Server',
  [AIErrorType.VALIDATION]: 'AlertCircle',
  [AIErrorType.TIMEOUT]: 'Clock',
  [AIErrorType.API_KEY_MISSING]: 'Key',
  [AIErrorType.QUOTA_EXCEEDED]: 'AlertTriangle',
  [AIErrorType.INVALID_REQUEST]: 'AlertCircle',
  [AIErrorType.SERVER_ERROR]: 'Server',
  [AIErrorType.UNKNOWN_ERROR]: 'AlertCircle',
}

/**
 * AI 에러 타입별 색상 클래스
 */
export const AI_ERROR_COLORS: Record<AIErrorType, string> = {
  [AIErrorType.NETWORK]: 'text-blue-600',
  [AIErrorType.API]: 'text-orange-600',
  [AIErrorType.VALIDATION]: 'text-yellow-600',
  [AIErrorType.TIMEOUT]: 'text-purple-600',
  [AIErrorType.API_KEY_MISSING]: 'text-red-600',
  [AIErrorType.QUOTA_EXCEEDED]: 'text-red-600',
  [AIErrorType.INVALID_REQUEST]: 'text-yellow-600',
  [AIErrorType.SERVER_ERROR]: 'text-red-600',
  [AIErrorType.UNKNOWN_ERROR]: 'text-gray-600',
}

/**
 * 에러 메시지 가져오기
 * @param errorType - AI 에러 타입
 * @returns 에러 메시지
 */
export function getErrorMessage(errorType: AIErrorType): string {
  return AI_ERROR_MESSAGES[errorType] || AI_ERROR_MESSAGES[AIErrorType.UNKNOWN_ERROR]
}

/**
 * 에러 설명 가져오기
 * @param errorType - AI 에러 타입
 * @returns 에러 설명
 */
export function getErrorDescription(errorType: AIErrorType): string {
  return AI_ERROR_DESCRIPTIONS[errorType] || AI_ERROR_DESCRIPTIONS[AIErrorType.UNKNOWN_ERROR]
}

/**
 * 에러 해결 방법 가져오기
 * @param errorType - AI 에러 타입
 * @returns 해결 방법 배열
 */
export function getErrorSolutions(errorType: AIErrorType): string[] {
  return AI_ERROR_SOLUTIONS[errorType] || AI_ERROR_SOLUTIONS[AIErrorType.UNKNOWN_ERROR]
}

/**
 * 에러 아이콘 이름 가져오기
 * @param errorType - AI 에러 타입
 * @returns 아이콘 이름
 */
export function getErrorIcon(errorType: AIErrorType): string {
  return AI_ERROR_ICONS[errorType] || AI_ERROR_ICONS[AIErrorType.UNKNOWN_ERROR]
}

/**
 * 에러 색상 클래스 가져오기
 * @param errorType - AI 에러 타입
 * @returns 색상 클래스
 */
export function getErrorColor(errorType: AIErrorType): string {
  return AI_ERROR_COLORS[errorType] || AI_ERROR_COLORS[AIErrorType.UNKNOWN_ERROR]
}
