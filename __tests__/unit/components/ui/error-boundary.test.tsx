// __tests__/unit/components/ui/error-boundary.test.tsx
// 에러 바운더리 컴포넌트 테스트
// 에러 캐치 및 복구 UI 테스트
// 관련 파일: components/ui/error-boundary.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Mock error reporting
jest.mock('@/app/actions/error-reporting', () => ({
  reportError: jest.fn().mockResolvedValue({ success: true }),
}))

// 에러를 발생시키는 테스트 컴포넌트
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // 에러 로그 억제
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('에러가 없을 때 자식 컴포넌트를 렌더링해야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('에러 발생 시 에러 UI를 표시해야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByText('페이지를 로드하는 중에 문제가 발생했습니다')).toBeInTheDocument()
  })

  it('다시 시도 버튼을 클릭하면 에러 상태가 리셋되어야 한다', async () => {
    const user = userEvent.setup()
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument()

    const retryButton = screen.getByText('다시 시도')
    await user.click(retryButton)

    // 에러가 발생하지 않도록 다시 렌더링
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('홈으로 돌아가기 버튼을 클릭하면 홈으로 이동해야 한다', async () => {
    const user = userEvent.setup()
    
    // window.location.href 모킹
    delete (window as any).location
    window.location = { href: '' } as any

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const homeButton = screen.getByText('홈으로 돌아가기')
    await user.click(homeButton)

    expect(window.location.href).toBe('/')
  })

  it('개발 환경에서 에러 상세 정보를 표시해야 한다', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('개발자 정보')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('프로덕션 환경에서 에러 상세 정보를 숨겨야 한다', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('개발자 정보')).not.toBeInTheDocument()
    expect(screen.queryByText('Test error')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('커스텀 fallback UI를 사용해야 한다', () => {
    const customFallback = <div>Custom error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    expect(screen.queryByText('예상치 못한 오류가 발생했습니다')).not.toBeInTheDocument()
  })

  it('onError 콜백을 호출해야 한다', () => {
    const onErrorMock = jest.fn()

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('에러 리포팅을 수행해야 한다', async () => {
    const { reportError } = require('@/app/actions/error-reporting')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // 에러 리포팅이 호출되었는지 확인
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String),
      })
    )
  })
})
