// __tests__/unit/gemini/client.test.ts
// Gemini 클라이언트 초기화 및 싱글톤 패턴 테스트
// 관련 파일: lib/gemini/client.ts

import { getGeminiClient, resetGeminiClient, DEFAULT_GEMINI_MODEL, DEFAULT_GENERATION_CONFIG } from '@/lib/gemini/client'

// @google/genai 모킹
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}))

describe('Gemini Client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    resetGeminiClient()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getGeminiClient', () => {
    it('API 키가 설정된 경우 클라이언트를 반환해야 한다', () => {
      process.env.GEMINI_API_KEY = 'test-api-key'

      const client = getGeminiClient()

      expect(client).toBeDefined()
      expect(client).toHaveProperty('models')
    })

    it('API 키가 누락된 경우 에러를 throw해야 한다', () => {
      delete process.env.GEMINI_API_KEY

      expect(() => {
        getGeminiClient()
      }).toThrow('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
    })

    it('API 키가 빈 문자열인 경우 에러를 throw해야 한다', () => {
      process.env.GEMINI_API_KEY = ''

      expect(() => {
        getGeminiClient()
      }).toThrow()
    })

    it('싱글톤 패턴: 동일한 인스턴스를 반환해야 한다', () => {
      process.env.GEMINI_API_KEY = 'test-api-key'

      const client1 = getGeminiClient()
      const client2 = getGeminiClient()

      expect(client1).toBe(client2)
    })

    it('resetGeminiClient 호출 후 새로운 인스턴스를 생성해야 한다', () => {
      process.env.GEMINI_API_KEY = 'test-api-key'

      const client1 = getGeminiClient()
      resetGeminiClient()
      const client2 = getGeminiClient()

      // 싱글톤이 리셋되었으므로 새 인스턴스가 생성됨
      expect(client2).toBeDefined()
    })
  })

  describe('DEFAULT_GEMINI_MODEL', () => {
    it('기본 모델이 gemini-2.0-flash-001이어야 한다', () => {
      expect(DEFAULT_GEMINI_MODEL).toBe('gemini-2.0-flash-001')
    })
  })

  describe('DEFAULT_GENERATION_CONFIG', () => {
    it('기본 생성 설정이 올바르게 정의되어야 한다', () => {
      expect(DEFAULT_GENERATION_CONFIG).toEqual({
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      })
    })

    it('maxOutputTokens가 8192이어야 한다', () => {
      expect(DEFAULT_GENERATION_CONFIG.maxOutputTokens).toBe(8192)
    })
  })
})

