// __tests__/unit/hooks/useSession.test.tsx
// useSession 훅 단위 테스트
// 세션 상태 관리 및 변경 감지 테스트
// 관련 파일: lib/hooks/useSession.ts

import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from '@/lib/hooks/useSession'

// Supabase 클라이언트 모킹
const mockGetUser = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

describe('useSession Hook', () => {
  beforeEach(() => {
    mockGetUser.mockClear()
    mockOnAuthStateChange.mockClear()
  })

  it('초기 로딩 상태를 반환한다', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const { result } = renderHook(() => useSession())

    expect(result.current.loading).toBe(true)
  })

  it('로그인한 사용자 정보를 반환한다', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.loading).toBe(false)
    })
  })

  it('로그아웃 시 user를 null로 설정한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })
})


