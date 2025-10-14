// __tests__/unit/auth/SignInForm.test.tsx
// 로그인 폼 컴포넌트 단위 테스트
// 폼 렌더링, 유효성 검사, 제출 처리 테스트
// 관련 파일: components/auth/SignInForm.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '@/components/auth/SignInForm'

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

describe('SignInForm Component', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('모든 필수 입력 필드를 렌더링한다', () => {
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인/ })).toBeInTheDocument()
  })

  it('회원가입 페이지 링크를 표시한다', () => {
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    const signUpLink = screen.getByText('회원가입')
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute('href', '/signup')
  })

  it('유효하지 않은 이메일 형식에 대한 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    const emailInput = screen.getByLabelText('이메일')
    await user.type(emailInput, 'invalid-email')
    await user.tab() // blur 이벤트 트리거
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    })
  })

  it('빈 비밀번호 필드에 대한 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    const passwordInput = screen.getByLabelText('비밀번호')
    await user.click(passwordInput)
    await user.tab() // blur 이벤트 트리거
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('유효한 입력으로 폼을 제출한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue({})
    
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: /로그인/ }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('제출 중에는 버튼을 비활성화한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /로그인/ })
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
  })

  it('서버 에러를 표시한다', async () => {
    const user = userEvent.setup()
    const errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
    mockOnSubmit.mockResolvedValue({ error: errorMessage })
    
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /로그인/ }))
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('빈 이메일 필드에 대한 유효성 검사를 수행한다', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSubmit={mockOnSubmit} />)
    
    const emailInput = screen.getByLabelText('이메일')
    await user.click(emailInput)
    await user.tab() // blur 이벤트 트리거
    
    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    })
  })
})

