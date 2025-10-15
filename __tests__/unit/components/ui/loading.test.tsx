// __tests__/unit/components/ui/loading.test.tsx
// 로딩 상태 UI 컴포넌트 테스트
// LoadingSpinner, AILoading, LoadingButton, LoadingOverlay 컴포넌트 테스트
// 관련 파일: components/ui/loading.tsx, lib/types/ai.ts

import { render, screen } from '@testing-library/react'
import { LoadingSpinner, AILoading, LoadingButton, LoadingOverlay } from '@/components/ui/loading'
import type { AIProgress } from '@/lib/types/ai'

describe('LoadingSpinner', () => {
  it('기본 크기로 렌더링되어야 한다', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status', { hidden: true })
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-6', 'w-6') // 기본 md 크기
  })

  it('작은 크기로 렌더링되어야 한다', () => {
    render(<LoadingSpinner size="sm" />)
    const spinner = screen.getByRole('status', { hidden: true })
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('큰 크기로 렌더링되어야 한다', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = screen.getByRole('status', { hidden: true })
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('커스텀 클래스를 적용해야 한다', () => {
    render(<LoadingSpinner className="custom-class" />)
    const spinner = screen.getByRole('status', { hidden: true })
    expect(spinner).toHaveClass('custom-class')
  })
})

describe('AILoading', () => {
  const mockProgress: AIProgress = {
    step: 'generating',
    percentage: 60,
    message: 'AI가 내용을 분석하고 있습니다...',
    estimatedTime: 4,
  }

  it('진행률과 메시지를 표시해야 한다', () => {
    render(<AILoading progress={mockProgress} />)
    
    expect(screen.getByText('AI가 내용을 분석하고 있습니다...')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('커스텀 메시지를 표시해야 한다', () => {
    render(<AILoading message="커스텀 메시지" />)
    expect(screen.getByText('커스텀 메시지')).toBeInTheDocument()
  })

  it('진행률 표시를 숨길 수 있어야 한다', () => {
    render(<AILoading progress={mockProgress} showProgress={false} />)
    expect(screen.queryByText('60%')).not.toBeInTheDocument()
  })

  it('진행률이 없을 때 기본 메시지를 표시해야 한다', () => {
    render(<AILoading />)
    expect(screen.getByText('AI가 처리 중입니다...')).toBeInTheDocument()
  })
})

describe('LoadingButton', () => {
  it('로딩 중이 아닐 때 자식 요소를 표시해야 한다', () => {
    render(
      <LoadingButton isLoading={false}>
        <span>클릭하세요</span>
      </LoadingButton>
    )
    expect(screen.getByText('클릭하세요')).toBeInTheDocument()
  })

  it('로딩 중일 때 로딩 텍스트를 표시해야 한다', () => {
    render(
      <LoadingButton isLoading={true}>
        <span>클릭하세요</span>
      </LoadingButton>
    )
    expect(screen.getByText('처리 중...')).toBeInTheDocument()
    expect(screen.queryByText('클릭하세요')).not.toBeInTheDocument()
  })

  it('커스텀 로딩 텍스트를 표시해야 한다', () => {
    render(
      <LoadingButton isLoading={true} loadingText="저장 중...">
        <span>클릭하세요</span>
      </LoadingButton>
    )
    expect(screen.getByText('저장 중...')).toBeInTheDocument()
  })

  it('로딩 중일 때 버튼이 비활성화되어야 한다', () => {
    render(
      <LoadingButton isLoading={true}>
        <span>클릭하세요</span>
      </LoadingButton>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('disabled prop이 true일 때 버튼이 비활성화되어야 한다', () => {
    render(
      <LoadingButton disabled={true}>
        <span>클릭하세요</span>
      </LoadingButton>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})

describe('LoadingOverlay', () => {
  it('로딩 중이 아닐 때 렌더링되지 않아야 한다', () => {
    render(<LoadingOverlay isLoading={false} />)
    expect(screen.queryByText('AI가 처리 중입니다...')).not.toBeInTheDocument()
  })

  it('로딩 중일 때 오버레이를 표시해야 한다', () => {
    render(<LoadingOverlay isLoading={true} />)
    expect(screen.getByText('AI가 처리 중입니다...')).toBeInTheDocument()
  })

  it('진행률 정보를 표시해야 한다', () => {
    const mockProgress: AIProgress = {
      step: 'saving',
      percentage: 90,
      message: '저장 중...',
      estimatedTime: 1,
    }

    render(<LoadingOverlay isLoading={true} progress={mockProgress} />)
    expect(screen.getByText('저장 중...')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('커스텀 메시지를 표시해야 한다', () => {
    render(<LoadingOverlay isLoading={true} message="커스텀 로딩 메시지" />)
    expect(screen.getByText('커스텀 로딩 메시지')).toBeInTheDocument()
  })
})
