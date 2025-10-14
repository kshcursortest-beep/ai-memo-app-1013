// __tests__/unit/auth/validation.test.ts
// 인증 관련 유효성 검사 함수 단위 테스트
// 이메일 형식 검증, 비밀번호 강도 계산 함수 테스트
// 관련 파일: lib/utils/validation.ts

import {
  isValidEmail,
  calculatePasswordStrength,
  getPasswordStrengthLevel,
  getPasswordStrengthText,
  getPasswordStrengthColor,
} from '@/lib/utils/validation'

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('유효한 이메일 형식을 올바르게 검증한다', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.kr')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('유효하지 않은 이메일 형식을 거부한다', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('invalid@.com')).toBe(false)
      expect(isValidEmail('invalid@domain')).toBe(false)
    })
  })

  describe('calculatePasswordStrength', () => {
    it('약한 비밀번호는 낮은 점수를 받는다', () => {
      expect(calculatePasswordStrength('short')).toBeLessThanOrEqual(2)
      expect(calculatePasswordStrength('12345678')).toBeLessThanOrEqual(2)
    })

    it('중간 강도 비밀번호는 중간 점수를 받는다', () => {
      const strength = calculatePasswordStrength('Password123')
      expect(strength).toBeGreaterThan(2)
      expect(strength).toBeLessThanOrEqual(4)
    })

    it('강한 비밀번호는 높은 점수를 받는다', () => {
      expect(calculatePasswordStrength('StrongPass123!')).toBeGreaterThan(4)
      expect(calculatePasswordStrength('MyP@ssw0rd2024')).toBeGreaterThan(4)
    })

    it('비밀번호 길이에 따라 점수가 증가한다', () => {
      const short = calculatePasswordStrength('Pass1!')
      const long = calculatePasswordStrength('Password123!')
      expect(long).toBeGreaterThanOrEqual(short)
    })

    it('대문자, 소문자, 숫자, 특수문자를 포함하면 점수가 증가한다', () => {
      const noSpecial = calculatePasswordStrength('Password123')
      const withSpecial = calculatePasswordStrength('Password123!')
      expect(withSpecial).toBeGreaterThanOrEqual(noSpecial)
    })
  })

  describe('getPasswordStrengthLevel', () => {
    it('점수 0-2는 약함으로 분류된다', () => {
      expect(getPasswordStrengthLevel(0)).toBe('weak')
      expect(getPasswordStrengthLevel(1)).toBe('weak')
      expect(getPasswordStrengthLevel(2)).toBe('weak')
    })

    it('점수 3-4는 보통으로 분류된다', () => {
      expect(getPasswordStrengthLevel(3)).toBe('medium')
      expect(getPasswordStrengthLevel(4)).toBe('medium')
    })

    it('점수 5는 강함으로 분류된다', () => {
      expect(getPasswordStrengthLevel(5)).toBe('strong')
    })
  })

  describe('getPasswordStrengthText', () => {
    it('강도에 따른 올바른 텍스트를 반환한다', () => {
      expect(getPasswordStrengthText(0)).toBe('약함')
      expect(getPasswordStrengthText(3)).toBe('보통')
      expect(getPasswordStrengthText(5)).toBe('강함')
    })
  })

  describe('getPasswordStrengthColor', () => {
    it('강도에 따른 올바른 색상 클래스를 반환한다', () => {
      expect(getPasswordStrengthColor(0)).toBe('bg-red-500')
      expect(getPasswordStrengthColor(3)).toBe('bg-yellow-500')
      expect(getPasswordStrengthColor(5)).toBe('bg-green-500')
    })
  })
})

