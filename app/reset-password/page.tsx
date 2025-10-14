// app/reset-password/page.tsx
// 새 비밀번호 설정 페이지
// 이메일 링크를 통해 접근하여 비밀번호 재설정
// 관련 파일: components/auth/ResetPasswordForm.tsx, app/actions/auth.ts

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { updatePassword } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const handleUpdatePassword = async (newPassword: string) => {
    'use server'
    return await updatePassword(newPassword)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <ResetPasswordForm onSubmit={handleUpdatePassword} />
    </div>
  )
}

