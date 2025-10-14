// __tests__/unit/notes/DraftStatusIndicator.test.tsx
// 임시 저장 상태 표시 컴포넌트 단위 테스트
// 상태별 표시 및 애니메이션 테스트
// 관련 파일: components/notes/DraftStatusIndicator.tsx

import { render, screen, waitFor } from '@testing-library/react'
import { DraftStatusIndicator } from '@/components/notes/DraftStatusIndicator'
import '@testing-library/jest-dom'

// 타이머 모킹
jest.useFakeTimers()

describe('DraftStatusIndicator', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('idle 상태', () => {
    it('idle 상태일 때는 표시되지 않는다', () => {
      render(<DraftStatusIndicator status="idle" />)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('saving 상태', () => {
    it('saving 상태일 때 "임시 저장 중..." 메시지를 표시한다', () => {
      render(<DraftStatusIndicator status="saving" />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('임시 저장 중...')).toBeInTheDocument()
    })

    it('saving 상태일 때 로딩 스피너 아이콘을 표시한다', () => {
      const { container } = render(<DraftStatusIndicator status="saving" />)

      // lucide-react 아이콘은 svg 요소로 렌더링됨
      const spinner = container.querySelector('svg.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('saving 상태일 때 visible 클래스가 적용된다', () => {
      render(<DraftStatusIndicator status="saving" />)

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('opacity-100')
    })
  })

  describe('saved 상태', () => {
    it('saved 상태일 때 "임시 저장됨" 메시지를 표시한다', () => {
      render(<DraftStatusIndicator status="saved" />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('임시 저장됨')).toBeInTheDocument()
    })

    it('saved 상태일 때 체크 아이콘을 표시한다', () => {
      const { container } = render(<DraftStatusIndicator status="saved" />)

      const checkIcon = container.querySelector('.lucide-check')
      expect(checkIcon).toBeInTheDocument()
    })

    it('saved 상태는 2초 후 자동으로 숨겨진다', async () => {
      const { rerender } = render(<DraftStatusIndicator status="saved" />)

      // 초기에는 표시됨
      expect(screen.getByRole('status')).toBeInTheDocument()

      // 2초 후
      jest.advanceTimersByTime(2000)

      // React 상태 업데이트 대기
      await waitFor(() => {
        rerender(<DraftStatusIndicator status="saved" />)
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('saved 상태에서 다른 상태로 변경되면 타이머가 취소된다', () => {
      const { rerender } = render(<DraftStatusIndicator status="saved" />)

      // saved 상태일 때 표시됨
      expect(screen.getByRole('status')).toBeInTheDocument()

      // 1초 후 상태 변경 (2초 전에 변경)
      jest.advanceTimersByTime(1000)
      rerender(<DraftStatusIndicator status="saving" />)

      // 다시 1초 더 대기 (원래 타이머 만료 시점)
      jest.advanceTimersByTime(1000)

      // saving 상태는 계속 표시되어야 함
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('임시 저장 중...')).toBeInTheDocument()
    })
  })

  describe('상태 전환', () => {
    it('idle → saving 상태로 변경 시 표시된다', () => {
      const { rerender } = render(<DraftStatusIndicator status="idle" />)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()

      rerender(<DraftStatusIndicator status="saving" />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('임시 저장 중...')).toBeInTheDocument()
    })

    it('saving → saved 상태로 변경 시 메시지가 업데이트된다', () => {
      const { rerender } = render(<DraftStatusIndicator status="saving" />)

      expect(screen.getByText('임시 저장 중...')).toBeInTheDocument()

      rerender(<DraftStatusIndicator status="saved" />)

      expect(screen.getByText('임시 저장됨')).toBeInTheDocument()
      expect(screen.queryByText('임시 저장 중...')).not.toBeInTheDocument()
    })

    it('saved → idle 상태로 변경 시 숨겨진다', () => {
      const { rerender } = render(<DraftStatusIndicator status="saved" />)

      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<DraftStatusIndicator status="idle" />)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('role="status" 속성이 설정되어 있다', () => {
      render(<DraftStatusIndicator status="saving" />)

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('role', 'status')
    })

    it('aria-live="polite" 속성이 설정되어 있다', () => {
      render(<DraftStatusIndicator status="saving" />)

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')
    })

    it('아이콘에 aria-hidden 속성이 설정되어 있다', () => {
      const { container } = render(<DraftStatusIndicator status="saving" />)

      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('스타일', () => {
    it('텍스트 크기가 작게 설정되어 있다', () => {
      render(<DraftStatusIndicator status="saving" />)

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('text-sm')
    })

    it('전환 애니메이션이 적용되어 있다', () => {
      render(<DraftStatusIndicator status="saving" />)

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('transition-opacity')
      expect(statusElement).toHaveClass('duration-300')
    })

    it('아이템이 간격을 두고 배치되어 있다', () => {
      render(<DraftStatusIndicator status="saving" />)

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('gap-2')
    })
  })
})

