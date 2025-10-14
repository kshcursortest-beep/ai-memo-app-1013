// app/signup/page.tsx
// 회원가입 페이지
// 이메일/비밀번호 회원가입 폼을 표시하고 처리
// 관련 파일: components/auth/SignUpForm.tsx, app/actions/auth.ts

import { SignUpForm } from '@/components/auth/SignUpForm'
import { signUpWithEmail } from '@/app/actions/auth'

export default function SignUpPage() {
  const handleSignUp = async (email: string, password: string) => {
    'use server'
    return await signUpWithEmail(email, password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SignUpForm onSubmit={handleSignUp} />
    </div>
  )
}

