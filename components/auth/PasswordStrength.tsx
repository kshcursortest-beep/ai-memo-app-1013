// components/auth/PasswordStrength.tsx
// 비밀번호 강도 표시기 컴포넌트
// 입력된 비밀번호의 강도를 시각적으로 표시
// 관련 파일: components/auth/SignUpForm.tsx, lib/utils/validation.ts

'use client'

import {
  calculatePasswordStrength,
  getPasswordStrengthText,
  getPasswordStrengthColor,
} from '@/lib/utils/validation'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  // 비밀번호가 비어있으면 표시하지 않음
  if (!password) return null

  const strength = calculatePasswordStrength(password)
  const strengthText = getPasswordStrengthText(strength)
  const strengthColor = getPasswordStrengthColor(strength)
  
  // 강도 바 개수 계산 (최대 5개)
  const bars = Array.from({ length: 5 }, (_, i) => i < strength)

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {/* 강도 바 */}
      <div className="flex gap-1">
        {bars.map((active, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              active ? strengthColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      {/* 강도 텍스트 */}
      <p className="text-xs text-gray-600">
        비밀번호 강도: <span className="font-medium">{strengthText}</span>
      </p>
      
      {/* 도움말 */}
      {strength < 3 && (
        <p className="text-xs text-gray-500">
          더 안전한 비밀번호를 위해 대소문자, 숫자, 특수문자를 포함하세요.
        </p>
      )}
    </div>
  )
}

