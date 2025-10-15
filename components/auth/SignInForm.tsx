// components/auth/SignInForm.tsx
// 이메일/비밀번호 로그인 폼 컴포넌트
// 사용자 입력 수집, 유효성 검사, 로그인 Server Action 호출
// 관련 파일: app/login/page.tsx, app/actions/auth.ts, components/auth/SignUpForm.tsx

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isValidEmail } from '@/lib/utils/validation'

interface SignInFormProps {
  onSubmit: (email: string, password: string) => Promise<{ error?: string }>
}

export function SignInForm({ onSubmit }: SignInFormProps) {
  const router = useRouter()
  
  // 폼 상태
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 에러 상태
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')

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

  // 비밀번호 유효성 검사
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('비밀번호를 입력해주세요.')
      return false
    }
    setPasswordError('')
    return true
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // 유효성 검사
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    
    if (!isEmailValid || !isPasswordValid) {
      return
    }

    setIsLoading(true)
    setFormError('')

    try {
      const result = await onSubmit(email, password)
      
      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
      } else {
        // 성공 시 메인 페이지로 이동
        toast.success('로그인되었습니다!')
        router.push('/')
      }
    } catch {
      const errorMessage = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
      setFormError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>
          계정에 로그인하여 메모를 확인하세요
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

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
              <a 
                href="/forgot-password" 
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                비밀번호를 잊으셨나요?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) validatePassword(e.target.value)
              }}
              onBlur={() => validatePassword(password)}
              disabled={isLoading}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              required
            />
            {passwordError && (
              <p id="password-error" className="text-sm text-red-600" role="alert">
                {passwordError}
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
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          {/* 회원가입 링크 */}
          <p className="text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

