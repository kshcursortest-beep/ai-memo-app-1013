// lib/gemini/prompts.ts
// Gemini API를 위한 프롬프트 템플릿
// 노트 요약, 태그 생성 등 AI 작업에 사용되는 프롬프트 정의
// 관련 파일: app/actions/summaries.ts, lib/gemini/generateText.ts

/**
 * 노트 요약 생성을 위한 프롬프트 생성
 * @param noteContent - 요약할 노트 내용
 * @returns 요약 생성을 위한 프롬프트 문자열
 */
export function createSummaryPrompt(noteContent: string): string {
  return `다음 노트 내용을 3-6개의 불릿 포인트로 요약해주세요.

요약 규칙:
- 반드시 3개 이상, 6개 이하의 불릿 포인트로 작성
- 각 불릿 포인트는 한 문장으로 간결하게 작성
- 핵심 내용과 중요한 정보를 중심으로 추출
- 불릿 포인트 형식: "- 내용" (마크다운 형식)
- 한국어로 작성
- 불필요한 부연 설명이나 서론 없이 바로 불릿 포인트로 시작

노트 내용:
${noteContent}

요약:`
}

/**
 * 긴 노트 내용 자르기 (토큰 제한 대응)
 * @param content - 원본 노트 내용
 * @param maxLength - 최대 길이 (기본값: 8000자)
 * @returns 잘린 노트 내용
 */
export function truncateNoteContent(content: string, maxLength: number = 8000): string {
  if (content.length <= maxLength) {
    return content
  }

  return content.substring(0, maxLength) + '\n\n... (내용이 잘렸습니다)'
}

