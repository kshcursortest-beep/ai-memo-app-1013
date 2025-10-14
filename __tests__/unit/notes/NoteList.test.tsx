// __tests__/unit/notes/NoteList.test.tsx
// NoteList 컴포넌트 단위 테스트
// 노트 목록 렌더링 및 빈 상태 UI 검증
// 관련 파일: components/notes/NoteList.tsx

import { render, screen } from '@testing-library/react'
import { NoteList } from '@/components/notes/NoteList'
import '@testing-library/jest-dom'

// useRouter mock
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

describe('NoteList Component', () => {
  const mockNotes = [
    {
      id: '1',
      title: 'First Note',
      content: 'This is the first note content',
      createdAt: new Date('2025-10-14T10:00:00'),
    },
    {
      id: '2',
      title: 'Second Note',
      content: 'This is the second note content',
      createdAt: new Date('2025-10-14T11:00:00'),
    },
    {
      id: '3',
      title: 'Third Note',
      content: 'This is the third note content',
      createdAt: new Date('2025-10-14T12:00:00'),
    },
  ]

  describe('노트 목록 렌더링', () => {
    it('노트 목록을 렌더링한다', () => {
      render(<NoteList notes={mockNotes} />)

      expect(screen.getByText('First Note')).toBeInTheDocument()
      expect(screen.getByText('Second Note')).toBeInTheDocument()
      expect(screen.getByText('Third Note')).toBeInTheDocument()
    })

    it('각 노트의 본문 미리보기를 표시한다', () => {
      render(<NoteList notes={mockNotes} />)

      expect(screen.getByText(/This is the first note content/)).toBeInTheDocument()
      expect(screen.getByText(/This is the second note content/)).toBeInTheDocument()
      expect(screen.getByText(/This is the third note content/)).toBeInTheDocument()
    })

    it('반응형 그리드 레이아웃을 적용한다', () => {
      const { container } = render(<NoteList notes={mockNotes} />)

      const gridContainer = container.querySelector('[role="list"]')
      expect(gridContainer).toHaveClass('grid')
      expect(gridContainer).toHaveClass('grid-cols-1')
      expect(gridContainer).toHaveClass('sm:grid-cols-2')
      expect(gridContainer).toHaveClass('lg:grid-cols-3')
    })

    it('접근성 속성을 올바르게 설정한다', () => {
      render(<NoteList notes={mockNotes} />)

      const listContainer = screen.getByRole('list', { name: '노트 목록' })
      expect(listContainer).toBeInTheDocument()

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(3)
    })
  })

  describe('빈 상태 UI', () => {
    it('노트가 없을 때 빈 상태 UI를 표시한다', () => {
      render(<NoteList notes={[]} />)

      expect(screen.getByText('환영합니다! 🎉')).toBeInTheDocument()
    })

    it('빈 상태에서 "첫 노트 작성하기" 버튼을 표시한다', () => {
      render(<NoteList notes={[]} />)

      const button = screen.getByRole('button', { name: '첫 노트 작성하기' })
      expect(button).toBeInTheDocument()
    })

    it('빈 상태에서 노트 카드를 렌더링하지 않는다', () => {
      render(<NoteList notes={[]} />)

      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })
  })
})

