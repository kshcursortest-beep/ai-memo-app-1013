// __tests__/integration/auth/signup.test.ts
// 회원가입 플로우 통합 테스트
// Server Action과 Supabase Auth 통합 테스트
// 관련 파일: app/actions/auth.ts, lib/supabase/server.ts

import { signUpWithEmail } from '@/app/actions/auth'

// Supabase 클라이언트 모킹
const mockAuth = {
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

describe('회원가입 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('정상 회원가입 플로우', () => {
    it('유효한 이메일과 비밀번호로 회원가입에 성공한다', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await signUpWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        success: true,
        userId: 'test-user-id',
      })
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
      })
    })

    it('회원가입 성공 시 홈 페이지를 재검증한다', async () => {
      const { revalidatePath } = await import('next/cache')
      
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: 'test-id' } },
        error: null,
      })

      await signUpWithEmail('test@example.com', 'Password123!')

      expect(revalidatePath).toHaveBeenCalledWith('/')
    })
  })

  describe('중복 이메일 에러 시나리오', () => {
    it('이미 가입된 이메일로 회원가입 시 에러를 반환한다', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      })

      const result = await signUpWithEmail('existing@example.com', 'Password123!')

      expect(result).toEqual({
        error: '이미 가입된 이메일입니다.',
      })
    })
  })

  describe('유효하지 않은 이메일 형식', () => {
    it('잘못된 이메일 형식으로 회원가입 시 에러를 반환한다', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid email' },
      })

      const result = await signUpWithEmail('invalid-email', 'Password123!')

      expect(result).toEqual({
        error: '올바른 이메일 형식이 아닙니다.',
      })
    })
  })

  describe('비밀번호 요구사항 미충족', () => {
    it('약한 비밀번호로 회원가입 시 에러를 반환한다', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' },
      })

      const result = await signUpWithEmail('test@example.com', 'weak')

      expect(result).toEqual({
        error: '비밀번호가 요구사항을 충족하지 않습니다.',
      })
    })
  })

  describe('네트워크 에러 처리', () => {
    it('서버 오류 발생 시 사용자 친화적 메시지를 반환한다', async () => {
      mockAuth.signUp.mockRejectedValue(new Error('Network error'))

      const result = await signUpWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      })
    })
  })

  describe('사용자 데이터 없음', () => {
    it('회원가입 응답에 사용자 데이터가 없으면 에러를 반환한다', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await signUpWithEmail('test@example.com', 'Password123!')

      expect(result).toEqual({
        error: '회원가입에 실패했습니다.',
      })
    })
  })
})

