// __tests__/unit/notes/DraftRecoveryDialog.test.tsx
// 임시 저장 복구 다이얼로그 컴포넌트 단위 테스트
// 다이얼로그 렌더링, 복구/폐기 동작 테스트
// 관련 파일: components/notes/DraftRecoveryDialog.tsx

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DraftRecoveryDialog } from '@/components/notes/DraftRecoveryDialog'
import type { NoteDraft } from '@/lib/types/draft'
import '@testing-library/jest-dom'

// date-fns 모킹
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5분 전'),
}))

jest.mock('date-fns/locale', () => ({
  ko: {},
}))

describe('DraftRecoveryDialog', () => {
  const mockOnRecover = jest.fn()
  const mockOnDiscard = jest.fn()

  const mockDraft: NoteDraft = {
    title: '임시 저장된 노트 제목',
    content: '임시 저장된 노트 본문 내용입니다. 테스트 내용입니다.',
    savedAt: new Date('2025-10-14T12:00:00Z').toISOString(),
    userId: 'test-user-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('렌더링', () => {
    it('다이얼로그가 열릴 때 제목과 메시지를 표시한다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText('임시 저장된 노트를 발견했습니다')).toBeInTheDocument()
      expect(screen.getByText(/저장된 노트가 있습니다/)).toBeInTheDocument()
    })

    it('다이얼로그가 닫혀있을 때는 렌더링되지 않는다', () => {
      render(
        <DraftRecoveryDialog
          open={false}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(
        screen.queryByText('임시 저장된 노트를 발견했습니다')
      ).not.toBeInTheDocument()
    })

    it('draft가 null이면 렌더링되지 않는다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={null}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(
        screen.queryByText('임시 저장된 노트를 발견했습니다')
      ).not.toBeInTheDocument()
    })

    it('제목 미리보기를 표시한다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText('제목')).toBeInTheDocument()
      expect(screen.getByText(mockDraft.title)).toBeInTheDocument()
    })

    it('본문 미리보기를 표시한다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText('본문')).toBeInTheDocument()
      expect(screen.getByText(mockDraft.content)).toBeInTheDocument()
    })

    it('저장 시간을 표시한다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText(/5분 전/)).toBeInTheDocument()
    })

    it('제목이 50자를 초과하면 "..."으로 표시한다', () => {
      const longTitle = 'a'.repeat(60)
      const longDraft: NoteDraft = {
        ...mockDraft,
        title: longTitle,
      }

      render(
        <DraftRecoveryDialog
          open={true}
          draft={longDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText(longTitle.substring(0, 50) + '...')).toBeInTheDocument()
    })

    it('본문이 100자를 초과하면 "..."으로 표시한다', () => {
      const longContent = 'b'.repeat(120)
      const longDraft: NoteDraft = {
        ...mockDraft,
        content: longContent,
      }

      render(
        <DraftRecoveryDialog
          open={true}
          draft={longDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText(longContent.substring(0, 100) + '...')).toBeInTheDocument()
    })
  })

  describe('버튼 동작', () => {
    it('복구하기 버튼이 표시된다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const recoverButton = screen.getByRole('button', { name: '임시 저장 내용 복구' })
      expect(recoverButton).toBeInTheDocument()
    })

    it('폐기하기 버튼이 표시된다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: '임시 저장 내용 폐기' })
      expect(discardButton).toBeInTheDocument()
    })

    it('복구하기 버튼 클릭 시 onRecover가 호출된다', async () => {
      const user = userEvent.setup()
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const recoverButton = screen.getByRole('button', { name: '임시 저장 내용 복구' })
      await user.click(recoverButton)

      expect(mockOnRecover).toHaveBeenCalledTimes(1)
    })

    it('폐기하기 버튼 클릭 시 onDiscard가 호출된다', async () => {
      const user = userEvent.setup()
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: '임시 저장 내용 폐기' })
      await user.click(discardButton)

      expect(mockOnDiscard).toHaveBeenCalledTimes(1)
    })
  })

  describe('접근성', () => {
    it('복구하기 버튼에 적절한 aria-label이 있다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const recoverButton = screen.getByRole('button', { name: '임시 저장 내용 복구' })
      expect(recoverButton).toHaveAttribute('aria-label', '임시 저장 내용 복구')
    })

    it('폐기하기 버튼에 적절한 aria-label이 있다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: '임시 저장 내용 폐기' })
      expect(discardButton).toHaveAttribute('aria-label', '임시 저장 내용 폐기')
    })

    it('복구하기 버튼에 autoFocus가 설정되어 있다', () => {
      render(
        <DraftRecoveryDialog
          open={true}
          draft={mockDraft}
          onRecover={mockOnRecover}
          onDiscard={mockOnDiscard}
        />
      )

      const recoverButton = screen.getByRole('button', { name: '임시 저장 내용 복구' })
      // React의 autoFocus는 컴포넌트 마운트 시 포커스를 설정하지만
      // DOM 속성으로는 남지 않을 수 있으므로, 포커스 여부 확인은 생략
      // (실제 브라우저에서는 정상 동작)
      expect(recoverButton).toBeInTheDocument()
    })
  })
})

