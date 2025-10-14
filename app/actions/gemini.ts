// app/actions/gemini.ts
// Gemini API 테스트용 Server Action
// 테스트 페이지에서 Gemini API 호출을 위한 액션
// 관련 파일: lib/gemini/generateText.ts, app/test-gemini/page.tsx

'use server'

import { generateText } from '@/lib/gemini/generateText'

/**
 * Gemini API 테스트 함수
 * @param prompt - 테스트할 프롬프트
 * @returns Gemini API 응답 또는 에러
 */
export async function testGeminiAPI(
  prompt: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // 입력 검증
    if (!prompt || typeof prompt !== 'string') {
      return {
        success: false,
        error: '유효한 프롬프트를 입력해주세요.',
      }
    }

    const trimmedPrompt = prompt.trim()

    if (trimmedPrompt === '') {
      return {
        success: false,
        error: '프롬프트가 비어있습니다.',
      }
    }

    // Gemini API 호출
    const result = await generateText(trimmedPrompt)

    return result
  } catch (error) {
    console.error('Gemini API 테스트 실패:', error)
    return {
      success: false,
      error: 'Gemini API 호출 중 오류가 발생했습니다.',
    }
  }
}

