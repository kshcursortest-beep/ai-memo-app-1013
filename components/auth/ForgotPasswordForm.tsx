// components/auth/ForgotPasswordForm.tsx
// 비밀번호 재설정 요청 폼 컴포넌트
// 이메일 입력 및 재설정 링크 발송 요청
// 관련 파일: app/forgot-password/page.tsx, app/actions/auth.ts

'use client'

import { useState, FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isValidEmail } from '@/lib/utils/validation'

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<{ success?: boolean; message?: string; error?: string }>
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  // 폼 상태
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // 에러 상태
  const [emailError, setEmailError] = useState('')

  // 이메일 유효성 검사
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('이메일을 입력해주세요.')
      return false
    }
    if (!isValidEmail(value)) {
      setEmailError('올바른 이메일 형식이 아닙니다.')
      return false
    }
    setEmailError('')
    return true
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)

    try {
      const result = await onSubmit(email)
      
      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success(result.message || '비밀번호 재설정 링크가 발송되었습니다.')
        setIsSubmitted(true)
      }
    } catch (error) {
      toast.error('요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 성공 메시지 화면
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>이메일을 확인하세요</CardTitle>
          <CardDescription>
            비밀번호 재설정 링크가 발송되었습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
            이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
          </p>
          <p className="text-xs text-gray-500">
            이메일이 도착하지 않았나요? 스팸 폴더를 확인하거나 몇 분 후 다시 시도해주세요.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/login'}
          >
            로그인 페이지로 돌아가기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>비밀번호 재설정</CardTitle>
        <CardDescription>
          계정에 등록된 이메일 주소를 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) validateEmail(e.target.value)
              }}
              onBlur={() => validateEmail(email)}
              disabled={isLoading}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              required
            />
            {emailError && (
              <p id="email-error" className="text-sm text-red-600" role="alert">
                {emailError}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '발송 중...' : '재설정 링크 받기'}
          </Button>

          {/* 로그인 페이지 링크 */}
          <p className="text-center text-sm text-gray-600">
            비밀번호가 기억나셨나요?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              로그인
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

