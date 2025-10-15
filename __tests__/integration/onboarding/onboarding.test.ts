// __tests__/integration/onboarding/onboarding.test.ts
// 온보딩 Server Actions 통합 테스트
// 온보딩 상태 조회 및 저장 테스트
// 관련 파일: app/actions/onboarding.ts

import { getOnboardingStatus, completeOnboarding, resetOnboarding } from '@/app/actions/onboarding'

// Supabase 클라이언트 모킹
const mockAuth = {
  getUser: jest.fn(),
  updateUser: jest.fn(),
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

describe('온보딩 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOnboardingStatus', () => {
    it('온보딩을 완료한 사용자는 true를 반환한다', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            user_metadata: {
              has_completed_onboarding: true,
            },
          },
        },
        error: null,
      })

      const result = await getOnboardingStatus()

      expect(result.hasCompletedOnboarding).toBe(true)
      expect(result.userId).toBe('test-user-id')
    })

    it('온보딩을 완료하지 않은 사용자는 false를 반환한다', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            user_metadata: {},
          },
        },
        error: null,
      })

      const result = await getOnboardingStatus()

      expect(result.hasCompletedOnboarding).toBe(false)
    })
  })

  describe('completeOnboarding', () => {
    it('온보딩 완료 상태를 저장한다', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
          },
        },
        error: null,
      })

      mockAuth.updateUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const result = await completeOnboarding()

      expect(result.success).toBe(true)
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        data: {
          has_completed_onboarding: true,
        },
      })
    })
  })

  describe('resetOnboarding', () => {
    it('온보딩 상태를 초기화한다', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
          },
        },
        error: null,
      })

      mockAuth.updateUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const result = await resetOnboarding()

      expect(result.success).toBe(true)
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        data: {
          has_completed_onboarding: false,
        },
      })
    })
  })
})



