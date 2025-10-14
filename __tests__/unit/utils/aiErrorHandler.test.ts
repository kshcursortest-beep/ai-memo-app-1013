// __tests__/unit/utils/aiErrorHandler.test.ts
// AI 에러 핸들러 유틸리티 테스트
// 관련 파일: lib/utils/aiErrorHandler.ts

import {
  handleAIError,
  getAIErrorAction,
  formatAIErrorMessage,
} from '@/lib/utils/aiErrorHandler'
import { AIErrorType, AI_ERROR_MESSAGES } from '@/lib/types/ai'

describe('aiErrorHandler', () => {
  describe('handleAIError', () => {
    it('타임아웃 에러를 올바르게 처리해야 한다', () => {
      const error = new Error('Timeout: Processing took too long')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.TIMEOUT)
      expect(result.message).toBe(AI_ERROR_MESSAGES[AIErrorType.TIMEOUT])
      expect(result.action).toBe('retry')
      expect(result.originalError).toBe(error)
    })

    it('API 키 누락 에러를 올바르게 처리해야 한다', () => {
      const error = new Error('API key is missing')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.API_KEY_MISSING)
      expect(result.message).toBe(AI_ERROR_MESSAGES[AIErrorType.API_KEY_MISSING])
      expect(result.action).toBe('check-key')
    })

    it('GEMINI_API_KEY 관련 에러를 처리해야 한다', () => {
      const error = new Error('GEMINI_API_KEY is not set')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.API_KEY_MISSING)
      expect(result.action).toBe('check-key')
    })

    it('할당량 초과 에러 (status 429)를 처리해야 한다', () => {
      const error = { status: 429, message: 'Too many requests' }
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.QUOTA_EXCEEDED)
      expect(result.message).toBe(AI_ERROR_MESSAGES[AIErrorType.QUOTA_EXCEEDED])
      expect(result.action).toBe('wait')
    })

    it('할당량 초과 에러 (메시지 기반)를 처리해야 한다', () => {
      const error = new Error('quota exceeded')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.QUOTA_EXCEEDED)
      expect(result.action).toBe('wait')
    })

    it('rate limit 에러를 처리해야 한다', () => {
      const error = new Error('rate limit exceeded')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.QUOTA_EXCEEDED)
    })

    it('잘못된 요청 에러 (status 400)를 처리해야 한다', () => {
      const error = { status: 400, message: 'Bad request' }
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.INVALID_REQUEST)
      expect(result.message).toBe(AI_ERROR_MESSAGES[AIErrorType.INVALID_REQUEST])
      expect(result.action).toBe('check-key')
    })

    it('인증 에러 (status 401)를 처리해야 한다', () => {
      const error = { status: 401, message: 'Unauthorized' }
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.INVALID_REQUEST)
    })

    it('권한 에러 (status 403)를 처리해야 한다', () => {
      const error = { status: 403, message: 'Forbidden' }
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.INVALID_REQUEST)
    })

    it('서버 에러 (status 500)를 처리해야 한다', () => {
      const error = { status: 500, message: 'Internal server error' }
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.SERVER_ERROR)
      expect(result.message).toBe(AI_ERROR_MESSAGES[AIErrorType.SERVER_ERROR])
      expect(result.action).toBe('retry')
    })

    it('서버 에러 (status 503)를 처리해야 한다', () => {
      const error = { statusCode: 503, message: 'Service unavailable' }
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.SERVER_ERROR)
      expect(result.action).toBe('retry')
    })

    it('authentication 에러 메시지를 처리해야 한다', () => {
      const error = new Error('authentication failed')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.API_KEY_MISSING)
      expect(result.action).toBe('check-key')
    })

    it('unauthorized 에러 메시지를 처리해야 한다', () => {
      const error = new Error('unauthorized access')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.API_KEY_MISSING)
    })

    it('invalid request 에러 메시지를 처리해야 한다', () => {
      const error = new Error('invalid request format')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.INVALID_REQUEST)
      expect(result.action).toBe('retry')
    })

    it('bad request 에러 메시지를 처리해야 한다', () => {
      const error = new Error('bad request')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.INVALID_REQUEST)
    })

    it('알 수 없는 에러를 처리해야 한다', () => {
      const error = new Error('Unknown error')
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.UNKNOWN_ERROR)
      expect(result.message).toBe('Unknown error')
      expect(result.action).toBe('contact-support')
    })

    it('메시지가 없는 에러를 처리해야 한다', () => {
      const error = {}
      const result = handleAIError(error)

      expect(result.type).toBe(AIErrorType.UNKNOWN_ERROR)
      expect(result.message).toBe(AI_ERROR_MESSAGES[AIErrorType.UNKNOWN_ERROR])
    })
  })

  describe('getAIErrorAction', () => {
    it('API_KEY_MISSING에 대한 액션을 반환해야 한다', () => {
      const action = getAIErrorAction(AIErrorType.API_KEY_MISSING)

      expect(action.label).toBe('API 키 확인')
      expect(action.action).toBe('check-key')
    })

    it('QUOTA_EXCEEDED에 대한 액션을 반환해야 한다', () => {
      const action = getAIErrorAction(AIErrorType.QUOTA_EXCEEDED)

      expect(action.label).toBe('잠시 후 재시도')
      expect(action.action).toBe('wait')
    })

    it('TIMEOUT에 대한 액션을 반환해야 한다', () => {
      const action = getAIErrorAction(AIErrorType.TIMEOUT)

      expect(action.label).toBe('다시 시도')
      expect(action.action).toBe('retry')
    })

    it('INVALID_REQUEST에 대한 액션을 반환해야 한다', () => {
      const action = getAIErrorAction(AIErrorType.INVALID_REQUEST)

      expect(action.label).toBe('다시 시도')
      expect(action.action).toBe('retry')
    })

    it('SERVER_ERROR에 대한 액션을 반환해야 한다', () => {
      const action = getAIErrorAction(AIErrorType.SERVER_ERROR)

      expect(action.label).toBe('다시 시도')
      expect(action.action).toBe('retry')
    })

    it('UNKNOWN_ERROR에 대한 액션을 반환해야 한다', () => {
      const action = getAIErrorAction(AIErrorType.UNKNOWN_ERROR)

      expect(action.label).toBe('지원팀 문의')
      expect(action.action).toBe('contact-support')
    })
  })

  describe('formatAIErrorMessage', () => {
    it('에러 메시지를 포맷팅해야 한다', () => {
      const aiError = {
        type: AIErrorType.TIMEOUT,
        message: 'Test error message',
        action: 'retry' as const,
      }

      const formatted = formatAIErrorMessage(aiError)

      expect(formatted).toBe('Test error message')
    })

    it('원본 에러가 포함된 경우에도 메시지를 반환해야 한다', () => {
      const aiError = {
        type: AIErrorType.SERVER_ERROR,
        message: 'Server error occurred',
        originalError: new Error('Original'),
        action: 'retry' as const,
      }

      const formatted = formatAIErrorMessage(aiError)

      expect(formatted).toBe('Server error occurred')
    })
  })
})

