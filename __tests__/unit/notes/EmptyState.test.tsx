// __tests__/unit/notes/EmptyState.test.tsx
// EmptyState 컴포넌트 단위 테스트
// 빈 상태 UI, 주요 기능 소개, 온보딩 다시 보기 버튼 테스트
// 관련 파일: components/notes/EmptyState.tsx

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/notes/EmptyState'

// Next.js useRouter 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('EmptyState', () => {
  const mockPush = jest.fn()
  const mockOnShowOnboarding = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  describe('기본 렌더링', () => {
    it('환영 메시지를 표시한다', () => {
      render(<EmptyState hasCompletedOnboarding={true} />)

      expect(screen.getByText('환영합니다! 🎉')).toBeInTheDocument()
      expect(
        screen.getByText('첫 노트를 작성하여 AI 메모장을 시작해보세요')
      ).toBeInTheDocument()
    })

    it('주요 기능 소개를 표시한다', () => {
      render(<EmptyState hasCompletedOnboarding={true} />)

      expect(screen.getByText('쉬운 작성')).toBeInTheDocument()
      expect(screen.getByText('텍스트와 음성으로 노트 작성')).toBeInTheDocument()

      expect(screen.getByText('AI 요약')).toBeInTheDocument()
      expect(screen.getByText('자동으로 내용 정리 및 요약')).toBeInTheDocument()

      expect(screen.getByText('빠른 검색')).toBeInTheDocument()
      expect(screen.getByText('태그 기반으로 쉽게 찾기')).toBeInTheDocument()
    })

    it('CTA 버튼을 표시한다', () => {
      render(<EmptyState hasCompletedOnboarding={true} />)

      const ctaButton = screen.getByRole('button', { name: '첫 노트 작성하기' })
      expect(ctaButton).toBeInTheDocument()
    })
  })

  describe('CTA 버튼 동작', () => {
    it('CTA 버튼 클릭 시 노트 작성 페이지로 이동한다', async () => {
      const user = userEvent.setup()
      render(<EmptyState hasCompletedOnboarding={true} />)

      const ctaButton = screen.getByRole('button', { name: '첫 노트 작성하기' })
      await user.click(ctaButton)

      expect(mockPush).toHaveBeenCalledWith('/notes/new')
    })
  })

  describe('온보딩 다시 보기 버튼', () => {
    it('온보딩 완료 사용자에게 "온보딩 다시 보기" 버튼을 표시한다', () => {
      render(
        <EmptyState
          hasCompletedOnboarding={true}
          onShowOnboarding={mockOnShowOnboarding}
        />
      )

      const replayButton = screen.getByRole('button', { name: '온보딩 다시 보기' })
      expect(replayButton).toBeInTheDocument()
    })

    it('온보딩 미완료 사용자에게 "온보딩 다시 보기" 버튼을 표시하지 않는다', () => {
      render(<EmptyState hasCompletedOnboarding={false} />)

      const replayButton = screen.queryByRole('button', { name: '온보딩 다시 보기' })
      expect(replayButton).not.toBeInTheDocument()
    })

    it('onShowOnboarding이 없으면 "온보딩 다시 보기" 버튼을 표시하지 않는다', () => {
      render(<EmptyState hasCompletedOnboarding={true} />)

      const replayButton = screen.queryByRole('button', { name: '온보딩 다시 보기' })
      expect(replayButton).not.toBeInTheDocument()
    })

    it('"온보딩 다시 보기" 버튼 클릭 시 onShowOnboarding을 호출한다', async () => {
      const user = userEvent.setup()
      render(
        <EmptyState
          hasCompletedOnboarding={true}
          onShowOnboarding={mockOnShowOnboarding}
        />
      )

      const replayButton = screen.getByRole('button', { name: '온보딩 다시 보기' })
      await user.click(replayButton)

      expect(mockOnShowOnboarding).toHaveBeenCalledTimes(1)
    })
  })

  describe('템플릿 제안', () => {
    it('NoteTemplates 컴포넌트를 렌더링한다', () => {
      render(<EmptyState hasCompletedOnboarding={true} />)

      expect(screen.getByText('또는 템플릿으로 시작하기')).toBeInTheDocument()
      expect(screen.getByText('회의 노트')).toBeInTheDocument()
      expect(screen.getByText('아이디어 메모')).toBeInTheDocument()
      expect(screen.getByText('할 일 목록')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('모든 버튼에 적절한 aria-label이 있다', () => {
      render(
        <EmptyState
          hasCompletedOnboarding={true}
          onShowOnboarding={mockOnShowOnboarding}
        />
      )

      expect(
        screen.getByRole('button', { name: '첫 노트 작성하기' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: '온보딩 다시 보기' })
      ).toBeInTheDocument()
    })
  })
})

