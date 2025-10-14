// __tests__/unit/utils/dateFormat.test.ts
// 날짜 포맷팅 유틸리티 단위 테스트
// formatDate, truncateText 함수 검증
// 관련 파일: lib/utils/dateFormat.ts

import { formatDate, truncateText } from '@/lib/utils/dateFormat'

describe('dateFormat utils', () => {
  describe('formatDate', () => {
    it('1분 이내는 "방금 전"으로 표시한다', () => {
      const now = new Date()
      const date = new Date(now.getTime() - 30 * 1000) // 30초 전
      expect(formatDate(date)).toBe('방금 전')
    })

    it('1시간 이내는 "N분 전"으로 표시한다', () => {
      const now = new Date()
      const date = new Date(now.getTime() - 15 * 60 * 1000) // 15분 전
      expect(formatDate(date)).toBe('15분 전')
    })

    it('24시간 이내는 "N시간 전"으로 표시한다', () => {
      const now = new Date()
      const date = new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3시간 전
      expect(formatDate(date)).toBe('3시간 전')
    })

    it('7일 이내는 "N일 전"으로 표시한다', () => {
      const now = new Date()
      const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3일 전
      expect(formatDate(date)).toBe('3일 전')
    })

    it('7일 이후는 "YYYY-MM-DD" 형식으로 표시한다', () => {
      const now = new Date()
      const date = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10일 전
      expect(formatDate(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('문자열 날짜를 받아도 올바르게 처리한다', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10일 전
      const dateString = pastDate.toISOString()
      expect(formatDate(dateString)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('truncateText', () => {
    it('텍스트가 최대 길이보다 짧으면 그대로 반환한다', () => {
      const text = 'Hello'
      expect(truncateText(text, 10)).toBe('Hello')
    })

    it('텍스트가 최대 길이와 같으면 그대로 반환한다', () => {
      const text = 'Hello World'
      expect(truncateText(text, 11)).toBe('Hello World')
    })

    it('텍스트가 최대 길이보다 길면 잘라내고 말줄임표를 추가한다', () => {
      const text = 'This is a very long text that needs to be truncated'
      expect(truncateText(text, 20)).toBe('This is a very long ...')
    })

    it('한글 텍스트도 올바르게 처리한다', () => {
      const text = '이것은 매우 긴 텍스트입니다. 잘라내야 합니다.'
      expect(truncateText(text, 10)).toBe('이것은 매우 긴 텍...')
    })
  })
})

