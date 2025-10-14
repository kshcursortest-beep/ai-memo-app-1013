// __tests__/unit/notes/SummaryDisplay.test.tsx
// SummaryDisplay 컴포넌트 단위 테스트
// 요약 표시 및 시간 포맷팅 검증
// 관련 파일: components/notes/SummaryDisplay.tsx

import { render, screen } from '@testing-library/react'
import { SummaryDisplay } from '@/components/notes/SummaryDisplay'
import { formatDate } from '@/lib/utils/dateFormat'

// Mock: formatDate
jest.mock('@/lib/utils/dateFormat', () => ({
  formatDate: jest.fn(),
}))

const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>

describe('SummaryDisplay', () => {
  const mockSummary = {
    content: '- 첫 번째 요약 내용\n- 두 번째 요약 내용\n- 세 번째 요약 내용',
    model: 'gemini-2.0-flash-001',
    createdAt: new Date('2025-10-14T10:00:00Z'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormatDate.mockReturnValue('5분 전')
  })

  it('요약 제목을 렌더링해야 한다', () => {
    render(<SummaryDisplay summary={mockSummary} />)

    expect(screen.getByText('AI 요약')).toBeInTheDocument()
  })

  it('요약 내용을 불릿 포인트로 렌더링해야 한다', () => {
    render(<SummaryDisplay summary={mockSummary} />)

    expect(screen.getByText('첫 번째 요약 내용')).toBeInTheDocument()
    expect(screen.getByText('두 번째 요약 내용')).toBeInTheDocument()
    expect(screen.getByText('세 번째 요약 내용')).toBeInTheDocument()
  })

  it('생성 시간을 표시해야 한다', () => {
    render(<SummaryDisplay summary={mockSummary} />)

    expect(screen.getByText('5분 전')).toBeInTheDocument()
    expect(mockFormatDate).toHaveBeenCalledWith(mockSummary.createdAt)
  })

  it('showModel이 true일 때 AI 모델 정보를 표시해야 한다', () => {
    render(<SummaryDisplay summary={mockSummary} showModel={true} />)

    expect(screen.getByText(`모델: ${mockSummary.model}`)).toBeInTheDocument()
  })

  it('showModel이 false일 때 AI 모델 정보를 표시하지 않아야 한다', () => {
    render(<SummaryDisplay summary={mockSummary} showModel={false} />)

    expect(screen.queryByText(`모델: ${mockSummary.model}`)).not.toBeInTheDocument()
  })

  it('불릿 포인트 마커(-, *, •)를 제거하고 내용만 표시해야 한다', () => {
    const summaryWithMarkers = {
      ...mockSummary,
      content: '- 첫 번째\n* 두 번째\n• 세 번째',
    }

    render(<SummaryDisplay summary={summaryWithMarkers} />)

    expect(screen.getByText('첫 번째')).toBeInTheDocument()
    expect(screen.getByText('두 번째')).toBeInTheDocument()
    expect(screen.getByText('세 번째')).toBeInTheDocument()
  })

  it('빈 줄을 무시하고 렌더링해야 한다', () => {
    const summaryWithEmptyLines = {
      ...mockSummary,
      content: '- 첫 번째\n\n- 두 번째\n  \n- 세 번째',
    }

    render(<SummaryDisplay summary={summaryWithEmptyLines} />)

    const bulletPoints = screen.getAllByText(/첫 번째|두 번째|세 번째/)
    expect(bulletPoints).toHaveLength(3)
  })

  it('시간 포맷팅을 다양한 형식으로 표시할 수 있어야 한다', () => {
    mockFormatDate.mockReturnValue('1시간 전')

    render(<SummaryDisplay summary={mockSummary} />)

    expect(screen.getByText('1시간 전')).toBeInTheDocument()
  })
})

