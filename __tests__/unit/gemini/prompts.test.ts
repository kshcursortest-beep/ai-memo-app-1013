// __tests__/unit/gemini/prompts.test.ts
// Gemini 프롬프트 유틸리티 단위 테스트
// 프롬프트 생성 및 노트 내용 자르기 검증
// 관련 파일: lib/gemini/prompts.ts

import { createSummaryPrompt, truncateNoteContent } from '@/lib/gemini/prompts'

describe('createSummaryPrompt', () => {
  it('요약 프롬프트를 생성해야 한다', () => {
    const noteContent = '이것은 테스트 노트입니다. 여러 가지 정보가 포함되어 있습니다.'
    const prompt = createSummaryPrompt(noteContent)

    expect(prompt).toContain('3-6개의 불릿 포인트로 요약')
    expect(prompt).toContain(noteContent)
    expect(prompt).toContain('요약 규칙')
    expect(prompt).toContain('한국어로 작성')
  })

  it('노트 내용이 프롬프트에 포함되어야 한다', () => {
    const noteContent = '프로젝트 회의록: 다음 주 월요일에 릴리즈 예정'
    const prompt = createSummaryPrompt(noteContent)

    expect(prompt).toContain(noteContent)
  })

  it('불릿 포인트 형식 지시사항을 포함해야 한다', () => {
    const prompt = createSummaryPrompt('테스트 내용')

    expect(prompt).toContain('- 내용')
    expect(prompt).toContain('불릿 포인트 형식')
  })
})

describe('truncateNoteContent', () => {
  it('짧은 내용은 그대로 반환해야 한다', () => {
    const shortContent = '짧은 노트 내용'
    const result = truncateNoteContent(shortContent)

    expect(result).toBe(shortContent)
  })

  it('긴 내용을 최대 길이로 자르고 "내용이 잘렸습니다" 메시지를 추가해야 한다', () => {
    const longContent = 'a'.repeat(10000)
    const result = truncateNoteContent(longContent, 1000)

    expect(result.length).toBeLessThan(longContent.length)
    expect(result).toContain('내용이 잘렸습니다')
    expect(result.substring(0, 1000)).toBe(longContent.substring(0, 1000))
  })

  it('maxLength 기본값이 8000자여야 한다', () => {
    const content = 'a'.repeat(9000)
    const result = truncateNoteContent(content)

    expect(result.length).toBeLessThan(content.length)
    expect(result).toContain('내용이 잘렸습니다')
  })

  it('정확히 maxLength인 내용은 그대로 반환해야 한다', () => {
    const content = 'a'.repeat(1000)
    const result = truncateNoteContent(content, 1000)

    expect(result).toBe(content)
    expect(result).not.toContain('내용이 잘렸습니다')
  })

  it('maxLength + 1인 내용은 잘려야 한다', () => {
    const content = 'a'.repeat(1001)
    const result = truncateNoteContent(content, 1000)

    // 잘린 내용 + "내용이 잘렸습니다" 메시지가 추가되므로
    // 원본보다 짧지 않을 수 있지만, maxLength까지만 포함되어야 함
    expect(result).toContain('내용이 잘렸습니다')
    expect(result.substring(0, 1000)).toBe(content.substring(0, 1000))
  })
})

