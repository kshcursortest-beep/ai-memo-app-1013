// __tests__/unit/utils/errorHandler.test.ts
// 에러 핸들러 유틸리티 단위 테스트
// 에러 타입 분석 및 메시지 생성 테스트
// 관련 파일: lib/utils/errorHandler.ts

import { handleAuthError, getErrorAction, formatErrorMessage } from '@/lib/utils/errorHandler'
import { AuthErrorType } from '@/lib/types/errors'

describe('errorHandler 유틸리티', () => {
  describe('handleAuthError', () => {
    it('네트워크 에러를 감지한다', () => {
      const error = new Error('Network request failed')
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.NETWORK_ERROR)
      expect(result.message).toContain('인터넷 연결')
    })

    it('세션 만료 에러를 감지한다', () => {
      const error = { message: 'Session expired' }
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.SESSION_EXPIRED)
      expect(result.message).toContain('세션이 만료')
    })

    it('이메일 미확인 에러를 감지한다', () => {
      const error = { message: 'Email not confirmed' }
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.EMAIL_NOT_CONFIRMED)
      expect(result.message).toContain('이메일 인증')
    })

    it('잘못된 인증 정보 에러를 감지한다', () => {
      const error = { message: 'Invalid login credentials' }
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.INVALID_CREDENTIALS)
      expect(result.message).toContain('이메일 또는 비밀번호')
    })

    it('서버 에러 (5xx)를 감지한다', () => {
      const error = { status: 500, message: 'Internal Server Error' }
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.SERVER_ERROR)
      expect(result.message).toContain('서버에 일시적인 문제')
    })

    it('클라이언트 에러 (4xx)를 감지한다', () => {
      const error = { status: 400, message: 'Bad Request' }
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.CLIENT_ERROR)
    })

    it('알 수 없는 에러를 처리한다', () => {
      const error = { message: 'Something went wrong' }
      const result = handleAuthError(error)

      expect(result.type).toBe(AuthErrorType.UNKNOWN_ERROR)
    })
  })

  describe('getErrorAction', () => {
    it('네트워크 에러에 대해 재시도 액션을 반환한다', () => {
      const action = getErrorAction(AuthErrorType.NETWORK_ERROR)

      expect(action.label).toBe('다시 시도')
      expect(action.action).toBe('retry')
    })

    it('세션 만료에 대해 로그인 액션을 반환한다', () => {
      const action = getErrorAction(AuthErrorType.SESSION_EXPIRED)

      expect(action.label).toBe('로그인')
      expect(action.action).toBe('login')
    })

    it('이메일 미확인에 대해 재전송 액션을 반환한다', () => {
      const action = getErrorAction(AuthErrorType.EMAIL_NOT_CONFIRMED)

      expect(action.label).toBe('이메일 재전송')
      expect(action.action).toBe('resend-email')
    })
  })

  describe('formatErrorMessage', () => {
    it('에러 메시지를 포맷팅한다', () => {
      const error = {
        type: AuthErrorType.NETWORK_ERROR,
        message: '인터넷 연결을 확인해주세요.',
      }

      const formatted = formatErrorMessage(error)

      expect(formatted).toBe('인터넷 연결을 확인해주세요.')
    })
  })
})

