// lib/gemini/client.ts
// Gemini 클라이언트 초기화 및 관리
// 싱글톤 패턴으로 클라이언트 인스턴스 재사용
// 관련 파일: lib/gemini/generateText.ts, lib/gemini/validateEnv.ts

import { GoogleGenAI } from '@google/genai'
import { validateGeminiApiKey } from './validateEnv'

/**
 * Gemini 클라이언트 싱글톤 인스턴스
 */
let geminiClient: GoogleGenAI | null = null

/**
 * Gemini 클라이언트 초기화 및 반환 (싱글톤 패턴)
 * @returns GoogleGenAI 클라이언트 인스턴스
 * @throws {Error} GEMINI_API_KEY 환경 변수가 누락된 경우
 */
export function getGeminiClient(): GoogleGenAI {
  // 이미 초기화된 클라이언트가 있으면 재사용
  if (geminiClient) {
    return geminiClient
  }

  // 환경 변수 검증
  validateGeminiApiKey()

  // 새 클라이언트 생성
  geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  })

  return geminiClient
}

/**
 * 테스트용: 클라이언트 인스턴스 초기화
 * 주로 단위 테스트에서 사용
 */
export function resetGeminiClient(): void {
  geminiClient = null
}

/**
 * 기본 모델 이름 상수
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash-001'

/**
 * 기본 생성 설정
 */
export const DEFAULT_GENERATION_CONFIG = {
  maxOutputTokens: 8192,
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
}

