// lib/utils/validation.ts
// 유효성 검사 유틸리티 함수들
// 이메일 형식 검증, 비밀번호 강도 검사 등의 유틸리티 제공
// 관련 파일: components/auth/SignUpForm.tsx, components/auth/PasswordStrength.tsx

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 비밀번호 강도 계산 (0-5 점수)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0
  
  // 길이 체크
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  
  // 대문자 포함
  if (/[A-Z]/.test(password)) strength++
  
  // 소문자 포함
  if (/[a-z]/.test(password)) strength++
  
  // 숫자 포함
  if (/[0-9]/.test(password)) strength++
  
  // 특수문자 포함
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return Math.min(strength, 5)
}

/**
 * 비밀번호 강도 레벨 반환
 */
export function getPasswordStrengthLevel(strength: number): 'weak' | 'medium' | 'strong' {
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

/**
 * 비밀번호 강도 텍스트 반환
 */
export function getPasswordStrengthText(strength: number): string {
  const level = getPasswordStrengthLevel(strength)
  switch (level) {
    case 'weak':
      return '약함'
    case 'medium':
      return '보통'
    case 'strong':
      return '강함'
  }
}

/**
 * 비밀번호 강도 색상 반환
 */
export function getPasswordStrengthColor(strength: number): string {
  const level = getPasswordStrengthLevel(strength)
  switch (level) {
    case 'weak':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
  }
}

