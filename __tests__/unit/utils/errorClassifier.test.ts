// __tests__/unit/utils/errorClassifier.test.ts
// 에러 분류 유틸리티 테스트
// 다양한 에러 타입 분류 및 처리 방법 테스트
// 관련 파일: lib/utils/errorClassifier.ts

import { 
  classifyError, 
  getRecommendedAction, 
  isRetryableError, 
  requiresUserAction 
} from '@/lib/utils/errorClassifier'
import { AIErrorType } from '@/lib/types/ai'

describe('errorClassifier', () => {
  describe('classifyError', () => {
    it('네트워크 에러를 올바르게 분류해야 한다', () => {
      const networkError = new Error('Network request failed')
      const result = classifyError(networkError)
      
      expect(result.type).toBe(AIErrorType.NETWORK)
      expect(result.action).toBe('retry')
      expect(result.message).toContain('네트워크 연결')
    })

    it('API 키 에러를 올바르게 분류해야 한다', () => {
      const apiKeyError = new Error('API key is missing')
      const result = classifyError(apiKeyError)
      
      expect(result.type).toBe(AIErrorType.API_KEY_MISSING)
      expect(result.action).toBe('check-key')
      expect(result.message).toContain('API 키')
    })

    it('할당량 초과 에러를 올바르게 분류해야 한다', () => {
      const quotaError = new Error('Quota exceeded')
      const result = classifyError(quotaError)
      
      expect(result.type).toBe(AIErrorType.QUOTA_EXCEEDED)
      expect(result.action).toBe('wait')
      expect(result.message).toContain('한도를 초과')
    })

    it('타임아웃 에러를 올바르게 분류해야 한다', () => {
      const timeoutError = new Error('Request timeout')
      const result = classifyError(timeoutError)
      
      expect(result.type).toBe(AIErrorType.TIMEOUT)
      expect(result.action).toBe('retry')
      expect(result.message).toContain('시간이 초과')
    })

    it('서버 에러를 올바르게 분류해야 한다', () => {
      const serverError = new Error('Internal Server Error 500')
      const result = classifyError(serverError)
      
      expect(result.type).toBe(AIErrorType.SERVER_ERROR)
      expect(result.action).toBe('retry')
      expect(result.message).toContain('서버에 문제')
    })

    it('클라이언트 에러를 올바르게 분류해야 한다', () => {
      const clientError = new Error('Bad Request 400')
      const result = classifyError(clientError)
      
      expect(result.type).toBe(AIErrorType.INVALID_REQUEST)
      expect(result.action).toBe('retry')
      expect(result.message).toContain('잘못된 요청')
    })

    it('토큰 제한 에러를 올바르게 분류해야 한다', () => {
      const tokenError = new Error('Token limit exceeded')
      const result = classifyError(tokenError)
      
      expect(result.type).toBe(AIErrorType.VALIDATION)
      expect(result.action).toBe('retry')
      expect(result.message).toContain('입력 내용')
    })

    it('알 수 없는 에러를 기본값으로 분류해야 한다', () => {
      const unknownError = new Error('Some random error')
      const result = classifyError(unknownError)
      
      expect(result.type).toBe(AIErrorType.UNKNOWN_ERROR)
      expect(result.action).toBe('contact-support')
      expect(result.message).toContain('알 수 없는 오류')
    })

    it('null 에러를 처리해야 한다', () => {
      const result = classifyError(null)
      
      expect(result.type).toBe(AIErrorType.UNKNOWN_ERROR)
      expect(result.message).toContain('알 수 없는 오류')
    })

    it('문자열 에러를 처리해야 한다', () => {
      const result = classifyError('Network error')
      
      expect(result.type).toBe(AIErrorType.NETWORK)
      expect(result.message).toContain('네트워크 연결')
    })

    it('Axios 에러를 처리해야 한다', () => {
      const axiosError = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'API key invalid' }
        }
      }
      const result = classifyError(axiosError)
      
      expect(result.type).toBe(AIErrorType.API_KEY_MISSING)
      expect(result.message).toContain('API 키')
    })
  })

  describe('getRecommendedAction', () => {
    it('각 에러 타입별로 적절한 권장 액션을 반환해야 한다', () => {
      expect(getRecommendedAction(AIErrorType.NETWORK)).toContain('인터넷 연결')
      expect(getRecommendedAction(AIErrorType.API_KEY_MISSING)).toContain('관리자')
      expect(getRecommendedAction(AIErrorType.QUOTA_EXCEEDED)).toContain('잠시 후')
      expect(getRecommendedAction(AIErrorType.TIMEOUT)).toContain('다시 시도')
      expect(getRecommendedAction(AIErrorType.SERVER_ERROR)).toContain('복구')
      expect(getRecommendedAction(AIErrorType.INVALID_REQUEST)).toContain('확인')
      expect(getRecommendedAction(AIErrorType.VALIDATION)).toContain('확인')
      expect(getRecommendedAction(AIErrorType.API)).toContain('복구')
      expect(getRecommendedAction(AIErrorType.UNKNOWN_ERROR)).toContain('문의')
    })
  })

  describe('isRetryableError', () => {
    it('재시도 가능한 에러 타입을 올바르게 판단해야 한다', () => {
      expect(isRetryableError(AIErrorType.NETWORK)).toBe(true)
      expect(isRetryableError(AIErrorType.TIMEOUT)).toBe(true)
      expect(isRetryableError(AIErrorType.SERVER_ERROR)).toBe(true)
      expect(isRetryableError(AIErrorType.API)).toBe(true)
      expect(isRetryableError(AIErrorType.QUOTA_EXCEEDED)).toBe(true)
    })

    it('재시도 불가능한 에러 타입을 올바르게 판단해야 한다', () => {
      expect(isRetryableError(AIErrorType.API_KEY_MISSING)).toBe(false)
      expect(isRetryableError(AIErrorType.VALIDATION)).toBe(false)
      expect(isRetryableError(AIErrorType.INVALID_REQUEST)).toBe(false)
      expect(isRetryableError(AIErrorType.UNKNOWN_ERROR)).toBe(false)
    })
  })

  describe('requiresUserAction', () => {
    it('사용자 액션이 필요한 에러 타입을 올바르게 판단해야 한다', () => {
      expect(requiresUserAction(AIErrorType.API_KEY_MISSING)).toBe(true)
      expect(requiresUserAction(AIErrorType.VALIDATION)).toBe(true)
      expect(requiresUserAction(AIErrorType.INVALID_REQUEST)).toBe(true)
    })

    it('사용자 액션이 필요하지 않은 에러 타입을 올바르게 판단해야 한다', () => {
      expect(requiresUserAction(AIErrorType.NETWORK)).toBe(false)
      expect(requiresUserAction(AIErrorType.TIMEOUT)).toBe(false)
      expect(requiresUserAction(AIErrorType.SERVER_ERROR)).toBe(false)
      expect(requiresUserAction(AIErrorType.API)).toBe(false)
      expect(requiresUserAction(AIErrorType.QUOTA_EXCEEDED)).toBe(false)
      expect(requiresUserAction(AIErrorType.UNKNOWN_ERROR)).toBe(false)
    })
  })
})
