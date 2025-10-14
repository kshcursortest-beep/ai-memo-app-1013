// app/forgot-password/page.tsx
// 비밀번호 재설정 요청 페이지
// 이메일 입력하여 재설정 링크 받기
// 관련 파일: components/auth/ForgotPasswordForm.tsx, app/actions/auth.ts

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { requestPasswordReset } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const handleRequestReset = async (email: string) => {
    'use server'
    return await requestPasswordReset(email)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <ForgotPasswordForm onSubmit={handleRequestReset} />
    </div>
  )
}

