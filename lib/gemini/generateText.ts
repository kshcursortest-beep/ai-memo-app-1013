// lib/gemini/generateText.ts
// 텍스트 생성 유틸리티
// Gemini API를 사용한 텍스트 생성 및 타임아웃 처리
// 관련 파일: lib/gemini/client.ts, lib/utils/aiErrorHandler.ts

import { getGeminiClient, DEFAULT_GEMINI_MODEL, DEFAULT_GENERATION_CONFIG } from './client'
import { handleAIError } from '@/lib/utils/aiErrorHandler'

/**
 * 타임아웃 시간 (밀리초)
 */
const TIMEOUT_MS = 10000 // 10초

/**
 * 최대 프롬프트 길이 (문자 수)
 */
const MAX_PROMPT_LENGTH = 10000

/**
 * Gemini API를 사용하여 텍스트 생성
 * @param prompt - 생성할 텍스트에 대한 프롬프트
 * @param model - 사용할 모델 (기본값: gemini-2.0-flash-001)
 * @returns 생성된 텍스트 또는 에러 객체
 */
export async function generateText(
  prompt: string,
  model: string = DEFAULT_GEMINI_MODEL
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // 프롬프트 유효성 검사
    if (!prompt || typeof prompt !== 'string') {
      return {
        success: false,
        error: '프롬프트를 입력해주세요.',
      }
    }

    const trimmedPrompt = prompt.trim()

    if (trimmedPrompt === '') {
      return {
        success: false,
        error: '프롬프트가 비어있습니다.',
      }
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      return {
        success: false,
        error: `프롬프트는 최대 ${MAX_PROMPT_LENGTH}자까지 입력 가능합니다.`,
      }
    }

    // Gemini 클라이언트 가져오기
    const ai = getGeminiClient()

    // 타임아웃 프로미스
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: AI 처리 시간이 10초를 초과했습니다.'))
      }, TIMEOUT_MS)
    })

    // API 호출 프로미스
    const apiPromise = ai.models.generateContent({
      model,
      contents: trimmedPrompt,
      config: DEFAULT_GENERATION_CONFIG,
    })

    // 타임아웃과 API 호출 경쟁
    const response = await Promise.race([apiPromise, timeoutPromise])

    // 응답 텍스트 추출
    if (!response.text) {
      return {
        success: false,
        error: 'AI 응답이 비어있습니다.',
      }
    }

    return {
      success: true,
      text: response.text,
    }
  } catch (error) {
    // 에러 처리
    console.error('Gemini API 텍스트 생성 실패:', error)
    const aiError = handleAIError(error)

    return {
      success: false,
      error: aiError.message,
    }
  }
}

/**
 * 커스텀 설정으로 텍스트 생성
 * @param prompt - 프롬프트
 * @param config - 생성 설정
 * @returns 생성된 텍스트 또는 에러 객체
 */
export async function generateTextWithConfig(
  prompt: string,
  config: {
    model?: string
    maxOutputTokens?: number
    temperature?: number
    topP?: number
    topK?: number
  }
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // 프롬프트 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return {
        success: false,
        error: '유효한 프롬프트를 입력해주세요.',
      }
    }

    // Gemini 클라이언트 가져오기
    const ai = getGeminiClient()

    // 타임아웃 프로미스
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'))
      }, TIMEOUT_MS)
    })

    // 설정 병합
    const generationConfig = {
      ...DEFAULT_GENERATION_CONFIG,
      ...config,
    }

    // API 호출
    const apiPromise = ai.models.generateContent({
      model: config.model || DEFAULT_GEMINI_MODEL,
      contents: prompt.trim(),
      config: generationConfig,
    })

    const response = await Promise.race([apiPromise, timeoutPromise])

    return {
      success: true,
      text: response.text,
    }
  } catch (error) {
    console.error('Gemini API 텍스트 생성 실패:', error)
    const aiError = handleAIError(error)

    return {
      success: false,
      error: aiError.message,
    }
  }
}

