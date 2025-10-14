// __tests__/unit/auth/ForgotPasswordForm.test.tsx
// 비밀번호 재설정 요청 폼 컴포넌트 단위 테스트
// 폼 렌더링, 유효성 검사, 제출 처리 테스트
// 관련 파일: components/auth/ForgotPasswordForm.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

// sonner toast 모킹
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ForgotPasswordForm Component', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('이메일 입력 필드와 제출 버튼을 렌더링한다', () => {
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /재설정 링크 받기/ })).toBeInTheDocument()
  })

  it('유효하지 않은 이메일 형식에 대한 에러를 표시한다', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />)
    
    const emailInput = screen.getByLabelText('이메일')
    await user.type(emailInput, 'invalid-email')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    })
  })

  it('유효한 이메일로 폼을 제출한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue({ success: true, message: '이메일이 발송되었습니다.' })
    
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /재설정 링크 받기/ }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('성공 시 확인 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue({ success: true, message: '이메일이 발송되었습니다.' })
    
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /재설정 링크 받기/ }))
    
    await waitFor(() => {
      expect(screen.getByText(/이메일을 확인하세요/)).toBeInTheDocument()
    })
  })
})

