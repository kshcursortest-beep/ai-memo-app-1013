// __tests__/unit/auth/SignUpForm.test.tsx
// 회원가입 폼 컴포넌트 단위 테스트
// 폼 렌더링, 유효성 검사, 제출 처리 테스트
// 관련 파일: components/auth/SignUpForm.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '@/components/auth/SignUpForm'

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

describe('SignUpForm Component', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('모든 필수 입력 필드를 렌더링한다', () => {
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /회원가입/ })).toBeInTheDocument()
  })

  it('유효하지 않은 이메일 형식에 대한 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    const emailInput = screen.getByLabelText('이메일')
    await user.type(emailInput, 'invalid-email')
    await user.tab() // blur 이벤트 트리거
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    })
  })

  it('비밀번호가 8자 미만이면 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    await user.type(passwordInput, 'short')
    await user.tab() // blur 이벤트 트리거
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다.')).toBeInTheDocument()
    })
  })

  it('유효한 입력으로 폼을 제출한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue({})
    
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /회원가입/ }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'Password123!')
    })
  })

  it('제출 중에는 버튼을 비활성화한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'Password123!')
    
    const submitButton = screen.getByRole('button', { name: /회원가입/ })
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
  })

  it('서버 에러를 표시한다', async () => {
    const user = userEvent.setup()
    const errorMessage = '이미 가입된 이메일입니다.'
    mockOnSubmit.mockResolvedValue({ error: errorMessage })
    
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /회원가입/ }))
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('비밀번호 입력 시 강도 표시기를 표시한다', async () => {
    const user = userEvent.setup()
    render(<SignUpForm onSubmit={mockOnSubmit} />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    await user.type(passwordInput, 'Password123!')
    
    await waitFor(() => {
      expect(screen.getByText(/비밀번호 강도/)).toBeInTheDocument()
    })
  })
})

