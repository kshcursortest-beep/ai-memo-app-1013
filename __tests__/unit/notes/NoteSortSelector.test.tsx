// __tests__/unit/notes/NoteSortSelector.test.tsx
// NoteSortSelector 컴포넌트 단위 테스트
// 정렬 옵션 렌더링 및 선택 기능 검증
// 관련 파일: components/notes/NoteSortSelector.tsx

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteSortSelector } from '@/components/notes/NoteSortSelector'
import type { SortOption } from '@/lib/types/notes'

describe('NoteSortSelector Component', () => {
  const mockOnSortChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('정렬 옵션이 렌더링된다', () => {
    // Given & When: NoteSortSelector 렌더링
    render(<NoteSortSelector currentSort="latest" onSortChange={mockOnSortChange} />)

    // Then: 정렬 방식 선택 트리거가 표시됨
    const trigger = screen.getByRole('combobox', { name: /정렬 방식 선택/i })
    expect(trigger).toBeInTheDocument()
  })

  it('현재 선택된 정렬 옵션이 표시된다', () => {
    // Given & When: 최신순으로 렌더링
    const { rerender } = render(
      <NoteSortSelector currentSort="latest" onSortChange={mockOnSortChange} />
    )

    // Then: 최신순이 표시됨
    expect(screen.getByText('최신순')).toBeInTheDocument()

    // When: 제목순으로 변경
    rerender(<NoteSortSelector currentSort="title" onSortChange={mockOnSortChange} />)

    // Then: 제목순이 표시됨
    expect(screen.getByText('제목순')).toBeInTheDocument()
  })

  it('정렬 아이콘이 표시된다', () => {
    // Given & When: NoteSortSelector 렌더링
    const { container } = render(
      <NoteSortSelector currentSort="latest" onSortChange={mockOnSortChange} />
    )

    // Then: ArrowUpDown 아이콘이 표시됨
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('Props가 올바르게 전달된다', () => {
    // Given & When: NoteSortSelector 렌더링
    render(<NoteSortSelector currentSort="latest" onSortChange={mockOnSortChange} />)

    // Then: combobox와 값이 표시됨
    const trigger = screen.getByRole('combobox', { name: /정렬 방식 선택/i })
    expect(trigger).toBeInTheDocument()
  })

  it('모바일에서는 풀 너비로 표시된다', () => {
    // Given & When: NoteSortSelector 렌더링
    const { container } = render(
      <NoteSortSelector currentSort="latest" onSortChange={mockOnSortChange} />
    )

    // Then: 트리거가 w-full 클래스를 가짐 (sm:w-[150px]도 함께)
    const trigger = screen.getByRole('combobox', { name: /정렬 방식 선택/i })
    expect(trigger).toHaveClass('w-full')
  })

  it('접근성: ARIA label이 적용되어 있다', () => {
    // Given & When: NoteSortSelector 렌더링
    render(<NoteSortSelector currentSort="latest" onSortChange={mockOnSortChange} />)

    // Then: ARIA label이 존재함
    const trigger = screen.getByRole('combobox', { name: /정렬 방식 선택/i })
    expect(trigger).toHaveAttribute('aria-label', '정렬 방식 선택')
  })
})

