// app/actions/error-reporting.ts
// 에러 리포팅 Server Action
// 클라이언트에서 발생한 에러를 서버로 전송하여 로깅
// 관련 파일: lib/utils/errorClassifier.ts, components/ui/error-boundary.tsx

'use server'

import { createClient } from '@/lib/supabase/server'

interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
}

/**
 * 에러 리포팅
 * @param errorReport - 에러 정보
 * @returns 성공 여부 또는 에러 메시지
 */
export async function reportError(
  errorReport: ErrorReport
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인 (선택적)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 2. 에러 정보 정리
    const sanitizedReport = {
      ...errorReport,
      userId: user?.id || null,
      // 민감한 정보 제거
      message: sanitizeErrorMessage(errorReport.message),
      stack: errorReport.stack ? sanitizeStack(errorReport.stack) : null,
      componentStack: errorReport.componentStack ? sanitizeStack(errorReport.componentStack) : null,
    }

    // 3. 개발 환경에서는 콘솔에 로그
    if (process.env.NODE_ENV === 'development') {
      console.error('에러 리포팅:', sanitizedReport)
    }

    // 4. 프로덕션 환경에서는 외부 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      await sendToErrorService(sanitizedReport)
    }

    return { success: true }
  } catch (error) {
    console.error('에러 리포팅 실패:', error)
    return {
      success: false,
      error: '에러 리포팅에 실패했습니다.',
    }
  }
}

/**
 * 에러 메시지 정리 (민감한 정보 제거)
 * @param message - 원본 에러 메시지
 * @returns 정리된 에러 메시지
 */
function sanitizeErrorMessage(message: string): string {
  // API 키나 토큰 패턴 제거
  const sanitized = message
    .replace(/[A-Za-z0-9]{20,}/g, '[REDACTED]') // 긴 문자열 제거
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]') // Bearer 토큰
    .replace(/api[_-]?key[=:]\s*[A-Za-z0-9\-._~+/]+=*/gi, 'api_key=[REDACTED]') // API 키
    .replace(/token[=:]\s*[A-Za-z0-9\-._~+/]+=*/gi, 'token=[REDACTED]') // 토큰

  return sanitized
}

/**
 * 스택 트레이스 정리 (민감한 정보 제거)
 * @param stack - 원본 스택 트레이스
 * @returns 정리된 스택 트레이스
 */
function sanitizeStack(stack: string): string {
  return sanitizeErrorMessage(stack)
}

/**
 * 외부 에러 서비스로 전송 (예: Sentry, LogRocket 등)
 * @param errorReport - 에러 리포트
 */
async function sendToErrorService(errorReport: ErrorReport): Promise<void> {
  // 실제 구현에서는 Sentry, LogRocket 등의 서비스 사용
  // 예시: Sentry.captureException(new Error(errorReport.message), { extra: errorReport })
  
  // 현재는 간단한 로깅만 수행
  console.error('Production Error Report:', {
    message: errorReport.message,
    timestamp: errorReport.timestamp,
    url: errorReport.url,
    userId: errorReport.userId,
  })
}

/**
 * 배치 에러 리포팅 (여러 에러를 한 번에 전송)
 * @param errorReports - 에러 리포트 배열
 * @returns 성공 여부 또는 에러 메시지
 */
export async function reportBatchErrors(
  errorReports: ErrorReport[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (errorReports.length === 0) {
      return { success: true }
    }

    // 각 에러를 개별적으로 처리
    const results = await Promise.allSettled(
      errorReports.map(report => reportError(report))
    )

    const failures = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    )

    if (failures.length > 0) {
      console.error('일부 에러 리포팅 실패:', failures.length)
    }

    return { success: true }
  } catch (error) {
    console.error('배치 에러 리포팅 실패:', error)
    return {
      success: false,
      error: '배치 에러 리포팅에 실패했습니다.',
    }
  }
}

/**
 * 에러 통계 조회 (관리자용)
 * @param startDate - 시작 날짜
 * @param endDate - 종료 날짜
 * @returns 에러 통계 또는 에러 메시지
 */
export async function getErrorStats(
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean
  stats?: {
    totalErrors: number
    errorTypes: Record<string, number>
    topErrors: Array<{ message: string; count: number }>
  }
  error?: string
}> {
  try {
    // 실제 구현에서는 데이터베이스에서 에러 통계 조회
    // 현재는 더미 데이터 반환
    
    return {
      success: true,
      stats: {
        totalErrors: 0,
        errorTypes: {},
        topErrors: [],
      },
    }
  } catch (error) {
    console.error('에러 통계 조회 실패:', error)
    return {
      success: false,
      error: '에러 통계 조회에 실패했습니다.',
    }
  }
}
