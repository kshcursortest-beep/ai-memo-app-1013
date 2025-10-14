// __tests__/unit/layout/Header.test.tsx
// Header 컴포넌트 단위 테스트
// 로그인 상태에 따른 렌더링 및 로그아웃 버튼 테스트
// 관련 파일: components/layout/Header.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/Header'
import { User } from '@supabase/supabase-js'

// useRouter 모킹
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// sonner toast 모킹
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Header Component', () => {
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

  const mockOnSignOut = jest.fn()

  beforeEach(() => {
    mockOnSignOut.mockClear()
    mockPush.mockClear()
  })

  it('로그인하지 않은 경우 헤더를 표시하지 않는다', () => {
    const { container } = render(<Header user={null} onSignOut={mockOnSignOut} />)
    expect(container.firstChild).toBeNull()
  })

  it('로그인한 경우 사용자 이메일과 로그아웃 버튼을 표시한다', () => {
    render(<Header user={mockUser} onSignOut={mockOnSignOut} />)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그아웃/ })).toBeInTheDocument()
  })

  it('로그아웃 버튼 클릭 시 signOut 함수를 호출한다', async () => {
    const user = userEvent.setup()
    mockOnSignOut.mockResolvedValue({ success: true })
    
    render(<Header user={mockUser} onSignOut={mockOnSignOut} />)
    
    const signOutButton = screen.getByRole('button', { name: /로그아웃/ })
    await user.click(signOutButton)
    
    await waitFor(() => {
      expect(mockOnSignOut).toHaveBeenCalled()
    })
  })

  it('로그아웃 성공 시 로그인 페이지로 리다이렉트한다', async () => {
    const user = userEvent.setup()
    mockOnSignOut.mockResolvedValue({ success: true })
    
    render(<Header user={mockUser} onSignOut={mockOnSignOut} />)
    
    const signOutButton = screen.getByRole('button', { name: /로그아웃/ })
    await user.click(signOutButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})

