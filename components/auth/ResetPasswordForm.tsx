// components/auth/ResetPasswordForm.tsx
// 새 비밀번호 설정 폼 컴포넌트
// 비밀번호 입력, 확인, 강도 표시
// 관련 파일: app/reset-password/page.tsx, app/actions/auth.ts, components/auth/PasswordStrength.tsx

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordStrength } from './PasswordStrength'

interface ResetPasswordFormProps {
  onSubmit: (newPassword: string) => Promise<{ error?: string; success?: boolean }>
}

export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const router = useRouter()
  
  // 폼 상태
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 에러 상태
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [formError, setFormError] = useState('')

  // 새 비밀번호 유효성 검사
  const validateNewPassword = (value: string): boolean => {
    if (!value) {
      setNewPasswordError('비밀번호를 입력해주세요.')
      return false
    }
    if (value.length < 8) {
      setNewPasswordError('비밀번호는 최소 8자 이상이어야 합니다.')
      return false
    }
    setNewPasswordError('')
    return true
  }

  // 비밀번호 확인 유효성 검사
  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.')
      return false
    }
    if (value !== newPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // 유효성 검사
    const isNewPasswordValid = validateNewPassword(newPassword)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)
    
    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return
    }

    setIsLoading(true)
    setFormError('')

    try {
      const result = await onSubmit(newPassword)
      
      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        toast.success('비밀번호가 성공적으로 변경되었습니다!')
        router.push('/')
      }
    } catch {
      const errorMessage = '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.'
      setFormError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>새 비밀번호 설정</CardTitle>
        <CardDescription>
          새로운 비밀번호를 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 새 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="최소 8자 이상"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (newPasswordError) validateNewPassword(e.target.value)
                // 비밀번호 변경 시 확인 필드도 재검증
                if (confirmPassword) validateConfirmPassword(confirmPassword)
              }}
              onBlur={() => validateNewPassword(newPassword)}
              disabled={isLoading}
              aria-invalid={!!newPasswordError}
              aria-describedby={newPasswordError ? 'new-password-error' : undefined}
              required
            />
            {newPasswordError && (
              <p id="new-password-error" className="text-sm text-red-600" role="alert">
                {newPasswordError}
              </p>
            )}
            
            {/* 비밀번호 강도 표시기 */}
            <PasswordStrength password={newPassword} />
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (confirmPasswordError) validateConfirmPassword(e.target.value)
              }}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              disabled={isLoading}
              aria-invalid={!!confirmPasswordError}
              aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
              required
            />
            {confirmPasswordError && (
              <p id="confirm-password-error" className="text-sm text-red-600" role="alert">
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* 폼 에러 메시지 */}
          {formError && (
            <div className="rounded-md bg-red-50 p-3" role="alert">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

