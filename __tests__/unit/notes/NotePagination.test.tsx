// __tests__/unit/notes/NotePagination.test.tsx
// NotePagination 컴포넌트 단위 테스트
// 페이지네이션 버튼 및 페이지 정보 표시 검증
// 관련 파일: components/notes/NotePagination.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import { NotePagination } from '@/components/notes/NotePagination'
import '@testing-library/jest-dom'

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: jest.fn(() => mockSearchParams),
}))

describe('NotePagination Component', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('렌더링', () => {
    it('페이지네이션이 필요 없는 경우 렌더링하지 않는다 (totalPages <= 1)', () => {
      const { container } = render(
        <NotePagination currentPage={1} totalPages={1} total={5} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('페이지네이션이 필요한 경우 이전/다음 버튼을 렌더링한다', () => {
      render(<NotePagination currentPage={2} totalPages={5} total={50} />)

      expect(screen.getByRole('button', { name: '이전 페이지' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '다음 페이지' })).toBeInTheDocument()
    })

    it('현재 페이지와 전체 페이지를 표시한다', () => {
      render(<NotePagination currentPage={2} totalPages={5} total={50} />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('전체 노트 개수를 표시한다 (데스크톱)', () => {
      render(<NotePagination currentPage={2} totalPages={5} total={50} />)

      expect(screen.getByText('(전체 50개)')).toBeInTheDocument()
    })
  })

  describe('버튼 상태', () => {
    it('첫 페이지에서 이전 버튼이 비활성화된다', () => {
      render(<NotePagination currentPage={1} totalPages={5} total={50} />)

      const prevButton = screen.getByRole('button', { name: '이전 페이지' })
      expect(prevButton).toBeDisabled()
    })

    it('첫 페이지에서 다음 버튼은 활성화된다', () => {
      render(<NotePagination currentPage={1} totalPages={5} total={50} />)

      const nextButton = screen.getByRole('button', { name: '다음 페이지' })
      expect(nextButton).not.toBeDisabled()
    })

    it('마지막 페이지에서 다음 버튼이 비활성화된다', () => {
      render(<NotePagination currentPage={5} totalPages={5} total={50} />)

      const nextButton = screen.getByRole('button', { name: '다음 페이지' })
      expect(nextButton).toBeDisabled()
    })

    it('마지막 페이지에서 이전 버튼은 활성화된다', () => {
      render(<NotePagination currentPage={5} totalPages={5} total={50} />)

      const prevButton = screen.getByRole('button', { name: '이전 페이지' })
      expect(prevButton).not.toBeDisabled()
    })

    it('중간 페이지에서 이전/다음 버튼 모두 활성화된다', () => {
      render(<NotePagination currentPage={3} totalPages={5} total={50} />)

      const prevButton = screen.getByRole('button', { name: '이전 페이지' })
      const nextButton = screen.getByRole('button', { name: '다음 페이지' })

      expect(prevButton).not.toBeDisabled()
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('페이지 변경', () => {
    it('이전 버튼 클릭 시 이전 페이지로 이동한다', () => {
      render(<NotePagination currentPage={3} totalPages={5} total={50} />)

      const prevButton = screen.getByRole('button', { name: '이전 페이지' })
      fireEvent.click(prevButton)

      expect(mockPush).toHaveBeenCalledWith('/?page=2')
    })

    it('다음 버튼 클릭 시 다음 페이지로 이동한다', () => {
      render(<NotePagination currentPage={3} totalPages={5} total={50} />)

      const nextButton = screen.getByRole('button', { name: '다음 페이지' })
      fireEvent.click(nextButton)

      expect(mockPush).toHaveBeenCalledWith('/?page=4')
    })

    it('기존 쿼리 파라미터를 유지한다', () => {
      // 기존 쿼리 파라미터 설정
      mockSearchParams.set('filter', 'test')
      
      render(<NotePagination currentPage={2} totalPages={5} total={50} />)

      const nextButton = screen.getByRole('button', { name: '다음 페이지' })
      fireEvent.click(nextButton)

      // page 파라미터가 추가/업데이트되어야 함
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=3'))
    })
  })
})

