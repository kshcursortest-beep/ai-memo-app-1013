// lib/gemini/validateEnv.ts
// 환경 변수 검증 유틸리티
// GEMINI_API_KEY 존재 여부 및 형식 검증
// 관련 파일: lib/gemini/client.ts, lib/types/ai.ts

import { AIErrorType, AI_ERROR_MESSAGES } from '@/lib/types/ai'

/**
 * Gemini API 키 환경 변수 검증
 * @throws {Error} API 키가 누락되거나 잘못된 경우
 */
export function validateGeminiApiKey(): void {
  const apiKey = process.env.GEMINI_API_KEY

  // API 키 누락 확인
  if (!apiKey) {
    throw new Error(AI_ERROR_MESSAGES[AIErrorType.API_KEY_MISSING])
  }

  // API 키 형식 검증 (빈 문자열 체크)
  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY는 유효한 문자열이어야 합니다.')
  }
}

/**
 * 환경 변수 안전하게 가져오기
 * @returns GEMINI_API_KEY 또는 undefined
 */
export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY
}

