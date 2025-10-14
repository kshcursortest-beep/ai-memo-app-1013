// __tests__/integration/auth/password-reset.test.ts
// 비밀번호 재설정 플로우 통합 테스트
// Server Action과 Supabase Auth 통합 테스트
// 관련 파일: app/actions/auth.ts, lib/supabase/server.ts

import { requestPasswordReset, updatePassword } from '@/app/actions/auth'

// Supabase 클라이언트 모킹
const mockAuth = {
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  getUser: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: mockAuth,
  })),
}))

// Next.js 캐시 모킹
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('비밀번호 재설정 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('비밀번호 재설정 요청', () => {
    it('유효한 이메일로 재설정 링크 발송에 성공한다', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await requestPasswordReset('test@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toContain('비밀번호 재설정 링크가 이메일로 발송되었습니다')
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalled()
    })

    it('등록되지 않은 이메일에도 동일한 성공 메시지를 반환한다', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'User not found' },
      })

      const result = await requestPasswordReset('notfound@example.com')

      // 보안을 위해 성공 메시지 반환
      expect(result.success).toBe(true)
      expect(result.message).toContain('비밀번호 재설정 링크가 이메일로 발송되었습니다')
    })
  })

  describe('새 비밀번호 설정', () => {
    it('유효한 새 비밀번호로 업데이트에 성공한다', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockAuth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await updatePassword('NewPassword123!')

      expect(result.success).toBe(true)
      expect(result.userId).toBe('test-user-id')
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123!',
      })
    })

    it('약한 비밀번호는 에러를 반환한다', async () => {
      mockAuth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' },
      })

      const result = await updatePassword('weak')

      expect(result.error).toContain('비밀번호가 요구사항을 충족하지 않습니다')
    })

    it('이전 비밀번호와 동일한 경우 에러를 반환한다', async () => {
      mockAuth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'New password should be different from the old password' },
      })

      const result = await updatePassword('SamePassword123!')

      expect(result.error).toContain('새 비밀번호는 이전 비밀번호와 달라야 합니다')
    })
  })
})

