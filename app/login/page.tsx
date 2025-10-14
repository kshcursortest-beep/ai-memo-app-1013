// app/login/page.tsx
// 로그인 페이지
// 이메일/비밀번호 로그인 폼을 표시하고 처리
// 관련 파일: components/auth/SignInForm.tsx, app/actions/auth.ts

import { SignInForm } from '@/components/auth/SignInForm'
import { signInWithEmail } from '@/app/actions/auth'

export default function LoginPage() {
  const handleSignIn = async (email: string, password: string) => {
    'use server'
    return await signInWithEmail(email, password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SignInForm onSubmit={handleSignIn} />
    </div>
  )
}

