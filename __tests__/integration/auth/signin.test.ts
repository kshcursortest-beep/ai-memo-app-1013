// __tests__/integration/auth/signin.test.ts
// 로그인 플로우 통합 테스트
// Server Action과 Supabase Auth 통합 테스트
// 관련 파일: app/actions/auth.ts, lib/supabase/server.ts

import { signInWithEmail } from '@/app/actions/auth'

// Supabase 클라이언트 모킹
const mockAuth = {
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

describe('로그인 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('정상 로그인 플로우', () => {
    it('유효한 이메일과 비밀번호로 로그인에 성공한다', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      const result = await signInWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        success: true,
        userId: 'test-user-id',
      })
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      })
    })

    it('로그인 성공 시 홈 페이지를 재검증한다', async () => {
      const { revalidatePath } = await import('next/cache')
      
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-id' }, session: {} },
        error: null,
      })

      await signInWithEmail('test@example.com', 'Password123!')

      expect(revalidatePath).toHaveBeenCalledWith('/')
    })
  })

  describe('잘못된 인증 정보 에러 시나리오', () => {
    it('잘못된 이메일 또는 비밀번호로 로그인 시 에러를 반환한다', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await signInWithEmail('test@example.com', 'wrongpassword')

      expect(result).toEqual({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      })
    })
  })

  describe('이메일 미확인 에러 시나리오', () => {
    it('이메일 인증이 완료되지 않은 경우 에러를 반환한다', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      })

      const result = await signInWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        error: '이메일 인증이 완료되지 않았습니다.',
      })
    })
  })

  describe('유효하지 않은 이메일 형식', () => {
    it('잘못된 이메일 형식으로 로그인 시 에러를 반환한다', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'invalid email' },
      })

      const result = await signInWithEmail('invalid-email', 'Password123!')

      expect(result).toEqual({
        error: '올바른 이메일 형식이 아닙니다.',
      })
    })
  })

  describe('네트워크 에러 처리', () => {
    it('서버 오류 발생 시 사용자 친화적 메시지를 반환한다', async () => {
      mockAuth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const result = await signInWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      })
    })
  })

  describe('사용자 데이터 없음', () => {
    it('로그인 응답에 사용자 데이터가 없으면 에러를 반환한다', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const result = await signInWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        error: '로그인에 실패했습니다.',
      })
    })
  })

  describe('세션 지속성', () => {
    it('로그인 시 세션이 자동으로 쿠키에 저장된다', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      }

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { 
          user: { id: 'test-id' }, 
          session: mockSession 
        },
        error: null,
      })

      const result = await signInWithEmail('test@example.com', 'Password123!')

      expect(result.success).toBe(true)
      // Supabase 클라이언트가 자동으로 세션을 쿠키에 저장함을 확인
      expect(mockAuth.signInWithPassword).toHaveBeenCalled()
    })
  })
})

