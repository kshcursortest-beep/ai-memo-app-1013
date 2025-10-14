// __tests__/unit/auth/ResetPasswordForm.test.tsx
// 새 비밀번호 설정 폼 컴포넌트 단위 테스트
// 폼 렌더링, 유효성 검사, 비밀번호 확인 테스트
// 관련 파일: components/auth/ResetPasswordForm.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

// useRouter 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// sonner toast 모킹
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ResetPasswordForm Component', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('필수 입력 필드를 렌더링한다', () => {
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /비밀번호 변경/ })).toBeInTheDocument()
  })

  it('비밀번호가 8자 미만이면 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    await user.type(passwordInput, 'short')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다.')).toBeInTheDocument()
    })
  })

  it('비밀번호가 일치하지 않으면 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('새 비밀번호'), 'Password123!')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'Different123!')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    })
  })

  it('유효한 비밀번호로 폼을 제출한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue({ success: true })
    
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('새 비밀번호'), 'Password123!')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /비밀번호 변경/ }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Password123!')
    })
  })

  it('비밀번호 강도 표시기를 표시한다', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    await user.type(passwordInput, 'Password123!')
    
    await waitFor(() => {
      expect(screen.getByText(/비밀번호 강도/)).toBeInTheDocument()
    })
  })
})

