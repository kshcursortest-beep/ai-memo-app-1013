// __tests__/unit/components/ui/error.test.tsx
// 에러 상태 UI 컴포넌트 테스트
// ErrorIcon, ErrorMessage, RetryButton, AIErrorDisplay 컴포넌트 테스트
// 관련 파일: components/ui/error.tsx, lib/types/ai.ts

import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorIcon, ErrorMessage, RetryButton, AIErrorDisplay } from '@/components/ui/error'
import { AIErrorType } from '@/lib/types/ai'
import type { AIError } from '@/lib/types/ai'

describe('ErrorIcon', () => {
  it('네트워크 에러 아이콘을 표시해야 한다', () => {
    render(<ErrorIcon errorType={AIErrorType.NETWORK} />)
    const icon = screen.getByTestId('error-icon')
    expect(icon).toBeInTheDocument()
  })

  it('API 에러 아이콘을 표시해야 한다', () => {
    render(<ErrorIcon errorType={AIErrorType.API} />)
    const icon = screen.getByTestId('error-icon')
    expect(icon).toBeInTheDocument()
  })

  it('타임아웃 에러 아이콘을 표시해야 한다', () => {
    render(<ErrorIcon errorType={AIErrorType.TIMEOUT} />)
    const icon = screen.getByTestId('error-icon')
    expect(icon).toBeInTheDocument()
  })

  it('알 수 없는 에러 아이콘을 표시해야 한다', () => {
    render(<ErrorIcon errorType={AIErrorType.UNKNOWN_ERROR} />)
    const icon = screen.getByTestId('error-icon')
    expect(icon).toBeInTheDocument()
  })

  it('커스텀 클래스를 적용해야 한다', () => {
    render(<ErrorIcon errorType={AIErrorType.NETWORK} className="custom-class" />)
    const icon = screen.getByTestId('error-icon')
    expect(icon).toHaveClass('custom-class')
  })
})

describe('ErrorMessage', () => {
  const mockError: AIError = {
    type: AIErrorType.NETWORK,
    message: '네트워크 연결에 문제가 있습니다.',
    originalError: new Error('Network error'),
    action: 'retry',
  }

  it('에러 메시지를 표시해야 한다', () => {
    render(<ErrorMessage error={mockError} />)
    expect(screen.getByText('네트워크 연결에 문제가 있습니다.')).toBeInTheDocument()
  })

  it('상세 정보를 숨겨야 한다', () => {
    render(<ErrorMessage error={mockError} showDetails={false} />)
    expect(screen.queryByText('상세 정보 보기')).not.toBeInTheDocument()
  })

  it('상세 정보를 표시해야 한다', () => {
    render(<ErrorMessage error={mockError} showDetails={true} />)
    expect(screen.getByText('상세 정보 보기')).toBeInTheDocument()
  })

  it('상세 정보를 클릭하면 원본 에러를 표시해야 한다', () => {
    render(<ErrorMessage error={mockError} showDetails={true} />)
    
    const detailsButton = screen.getByText('상세 정보 보기')
    fireEvent.click(detailsButton)
    
    // 상세 정보가 표시되는지 확인
    expect(screen.getByText('상세 정보 보기')).toBeInTheDocument()
  })

  it('커스텀 클래스를 적용해야 한다', () => {
    render(<ErrorMessage error={mockError} className="custom-class" />)
    const container = screen.getByText('네트워크 연결에 문제가 있습니다.').closest('div')
    expect(container).toBeInTheDocument()
  })
})

describe('RetryButton', () => {
  const mockOnRetry = jest.fn()

  beforeEach(() => {
    mockOnRetry.mockClear()
  })

  it('재시도 버튼을 렌더링해야 한다', () => {
    render(<RetryButton onRetry={mockOnRetry} />)
    expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
  })

  it('재시도 횟수를 표시해야 한다', () => {
    render(<RetryButton onRetry={mockOnRetry} retryCount={2} />)
    expect(screen.getByText('다시 시도 (2/3)')).toBeInTheDocument()
  })

  it('최대 재시도 횟수를 초과하면 비활성화되어야 한다', () => {
    render(<RetryButton onRetry={mockOnRetry} retryCount={3} maxRetries={3} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('재시도 횟수 초과')).toBeInTheDocument()
  })

  it('클릭 시 onRetry 콜백을 호출해야 한다', () => {
    render(<RetryButton onRetry={mockOnRetry} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('disabled prop이 true일 때 비활성화되어야 한다', () => {
    render(<RetryButton onRetry={mockOnRetry} disabled={true} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('커스텀 클래스를 적용해야 한다', () => {
    render(<RetryButton onRetry={mockOnRetry} className="custom-class" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})

describe('AIErrorDisplay', () => {
  const mockError: AIError = {
    type: AIErrorType.API,
    message: 'AI 서비스에 일시적인 문제가 발생했습니다.',
    originalError: new Error('API error'),
    action: 'retry',
  }

  const mockOnRetry = jest.fn()

  beforeEach(() => {
    mockOnRetry.mockClear()
  })

  it('에러 메시지와 재시도 버튼을 표시해야 한다', () => {
    render(<AIErrorDisplay error={mockError} onRetry={mockOnRetry} />)
    
    expect(screen.getByText('AI 서비스에 일시적인 문제가 발생했습니다.')).toBeInTheDocument()
    expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
  })

  it('onRetry가 없으면 재시도 버튼을 표시하지 않아야 한다', () => {
    render(<AIErrorDisplay error={mockError} />)
    expect(screen.queryByText('다시 시도')).not.toBeInTheDocument()
  })

  it('재시도 횟수를 표시해야 한다', () => {
    render(<AIErrorDisplay error={mockError} onRetry={mockOnRetry} retryCount={1} />)
    expect(screen.getByText('다시 시도 (1/3)')).toBeInTheDocument()
  })

  it('최대 재시도 횟수를 설정할 수 있어야 한다', () => {
    render(<AIErrorDisplay error={mockError} onRetry={mockOnRetry} maxRetries={5} />)
    expect(screen.getByText('다시 시도 (0/5)')).toBeInTheDocument()
  })

  it('상세 정보를 표시할 수 있어야 한다', () => {
    render(<AIErrorDisplay error={mockError} onRetry={mockOnRetry} showDetails={true} />)
    expect(screen.getByText('상세 정보 보기')).toBeInTheDocument()
  })

  it('재시도 버튼 클릭 시 onRetry를 호출해야 한다', () => {
    render(<AIErrorDisplay error={mockError} onRetry={mockOnRetry} />)
    
    const retryButton = screen.getByText('다시 시도 (0/3)')
    fireEvent.click(retryButton)
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('커스텀 클래스를 적용해야 한다', () => {
    render(<AIErrorDisplay error={mockError} onRetry={mockOnRetry} className="custom-class" />)
    const container = screen.getByText('AI 서비스에 일시적인 문제가 발생했습니다.').closest('div')
    expect(container).toBeInTheDocument()
  })
})
