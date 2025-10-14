// __tests__/unit/notes/NoteTemplates.test.tsx
// NoteTemplates 컴포넌트 단위 테스트
// 템플릿 목록 렌더링 및 네비게이션 테스트
// 관련 파일: components/notes/NoteTemplates.tsx

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { NoteTemplates } from '@/components/notes/NoteTemplates'
import { NOTE_TEMPLATES } from '@/lib/types/templates'

// Next.js useRouter 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('NoteTemplates', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  describe('템플릿 목록 렌더링', () => {
    it('3개의 템플릿을 렌더링한다', () => {
      render(<NoteTemplates />)

      expect(screen.getByText('회의 노트')).toBeInTheDocument()
      expect(screen.getByText('아이디어 메모')).toBeInTheDocument()
      expect(screen.getByText('할 일 목록')).toBeInTheDocument()
    })

    it('각 템플릿의 제목과 설명을 표시한다', () => {
      render(<NoteTemplates />)

      NOTE_TEMPLATES.forEach((template) => {
        expect(screen.getByText(template.title)).toBeInTheDocument()
        expect(screen.getByText(template.description)).toBeInTheDocument()
      })
    })

    it('템플릿 섹션 제목을 표시한다', () => {
      render(<NoteTemplates />)

      expect(screen.getByText('또는 템플릿으로 시작하기')).toBeInTheDocument()
    })
  })

  describe('템플릿 선택 동작', () => {
    it('회의 노트 템플릿 클릭 시 올바른 URL로 네비게이션한다', async () => {
      const user = userEvent.setup()
      render(<NoteTemplates />)

      const meetingButton = screen.getByRole('button', {
        name: '회의 노트 템플릿으로 노트 작성',
      })
      await user.click(meetingButton)

      expect(mockPush).toHaveBeenCalledWith('/notes/new?template=meeting')
    })

    it('아이디어 메모 템플릿 클릭 시 올바른 URL로 네비게이션한다', async () => {
      const user = userEvent.setup()
      render(<NoteTemplates />)

      const ideaButton = screen.getByRole('button', {
        name: '아이디어 메모 템플릿으로 노트 작성',
      })
      await user.click(ideaButton)

      expect(mockPush).toHaveBeenCalledWith('/notes/new?template=idea')
    })

    it('할 일 목록 템플릿 클릭 시 올바른 URL로 네비게이션한다', async () => {
      const user = userEvent.setup()
      render(<NoteTemplates />)

      const todoButton = screen.getByRole('button', {
        name: '할 일 목록 템플릿으로 노트 작성',
      })
      await user.click(todoButton)

      expect(mockPush).toHaveBeenCalledWith('/notes/new?template=todo')
    })
  })

  describe('접근성', () => {
    it('모든 템플릿 버튼에 적절한 aria-label이 있다', () => {
      render(<NoteTemplates />)

      expect(
        screen.getByRole('button', { name: '회의 노트 템플릿으로 노트 작성' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: '아이디어 메모 템플릿으로 노트 작성' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: '할 일 목록 템플릿으로 노트 작성' })
      ).toBeInTheDocument()
    })

    it('모든 템플릿 버튼이 키보드로 접근 가능하다', () => {
      render(<NoteTemplates />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label')
      })
    })
  })

  describe('반응형 레이아웃', () => {
    it('그리드 레이아웃 클래스를 적용한다', () => {
      const { container } = render(<NoteTemplates />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })
  })
})

