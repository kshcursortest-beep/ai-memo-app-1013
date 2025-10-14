// __tests__/unit/gemini/generateText.test.ts
// 텍스트 생성 함수 테스트
// 관련 파일: lib/gemini/generateText.ts

// @google/genai 모킹 (파일 최상단에서 먼저 모킹)
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}))

import { generateText, generateTextWithConfig } from '@/lib/gemini/generateText'
import { getGeminiClient } from '@/lib/gemini/client'

// 관련 모듈 모킹
jest.mock('@/lib/gemini/client')
jest.mock('@/lib/utils/aiErrorHandler', () => ({
  handleAIError: jest.fn((error) => ({
    type: 'UNKNOWN_ERROR',
    message: error.message || 'AI 처리 중 알 수 없는 오류가 발생했습니다.',
    originalError: error,
    action: 'retry',
  })),
}))

describe('generateText', () => {
  const mockGenerateContent = jest.fn()
  const mockClient = {
    models: {
      generateContent: mockGenerateContent,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getGeminiClient as jest.Mock).mockReturnValue(mockClient)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('정상 케이스', () => {
    it('유효한 프롬프트로 텍스트를 성공적으로 생성해야 한다', async () => {
      const mockResponse = {
        text: 'Generated text response',
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await generateText('Test prompt')

      expect(result.success).toBe(true)
      expect(result.text).toBe('Generated text response')
      expect(result.error).toBeUndefined()
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-001',
        contents: 'Test prompt',
        config: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        },
      })
    })

    it('앞뒤 공백이 있는 프롬프트를 trim 처리해야 한다', async () => {
      const mockResponse = { text: 'Response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await generateText('  Test prompt  ')

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: 'Test prompt',
        })
      )
    })
  })

  describe('프롬프트 유효성 검사', () => {
    it('빈 프롬프트인 경우 에러를 반환해야 한다', async () => {
      const result = await generateText('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('프롬프트를 입력해주세요.')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('공백만 있는 프롬프트인 경우 에러를 반환해야 한다', async () => {
      const result = await generateText('   ')

      expect(result.success).toBe(false)
      expect(result.error).toBe('프롬프트가 비어있습니다.')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('프롬프트가 null인 경우 에러를 반환해야 한다', async () => {
      const result = await generateText(null as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('프롬프트를 입력해주세요.')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('프롬프트가 문자열이 아닌 경우 에러를 반환해야 한다', async () => {
      const result = await generateText(12345 as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('프롬프트를 입력해주세요.')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('프롬프트가 최대 길이를 초과하는 경우 에러를 반환해야 한다', async () => {
      const longPrompt = 'a'.repeat(10001)

      const result = await generateText(longPrompt)

      expect(result.success).toBe(false)
      expect(result.error).toContain('최대')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })
  })

  describe('타임아웃 처리', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('10초 타임아웃을 초과하면 에러를 반환해야 한다', async () => {
      // API 호출이 완료되지 않도록 설정
      mockGenerateContent.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 15000))
      )

      const resultPromise = generateText('Test prompt')

      // 10초 경과
      jest.advanceTimersByTime(10000)

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.error).toContain('처리 시간')
    })
  })

  describe('API 에러 처리', () => {
    it('Gemini API 에러를 처리해야 한다', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'))

      const result = await generateText('Test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('응답에 텍스트가 없는 경우 에러를 반환해야 한다', async () => {
      mockGenerateContent.mockResolvedValue({ text: null })

      const result = await generateText('Test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toBe('AI 응답이 비어있습니다.')
    })
  })

  describe('generateTextWithConfig', () => {
    it('커스텀 설정으로 텍스트를 생성해야 한다', async () => {
      const mockResponse = { text: 'Custom response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const customConfig = {
        temperature: 0.5,
        maxOutputTokens: 1024,
      }

      const result = await generateTextWithConfig('Test prompt', customConfig)

      expect(result.success).toBe(true)
      expect(result.text).toBe('Custom response')
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-001',
        contents: 'Test prompt',
        config: expect.objectContaining({
          temperature: 0.5,
          maxOutputTokens: 1024,
        }),
      })
    })

    it('커스텀 모델을 사용할 수 있어야 한다', async () => {
      const mockResponse = { text: 'Response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await generateTextWithConfig('Test', { model: 'gemini-2.0-flash-exp' })

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.0-flash-exp',
        })
      )
    })

    it('빈 프롬프트인 경우 에러를 반환해야 한다', async () => {
      const result = await generateTextWithConfig('', {})

      expect(result.success).toBe(false)
      expect(result.error).toBe('유효한 프롬프트를 입력해주세요.')
    })
  })
})

