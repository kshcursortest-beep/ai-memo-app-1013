// __tests__/unit/notes/SummaryGenerateButton.test.tsx
// SummaryGenerateButton 컴포넌트 단위 테스트
// 버튼 렌더링, 클릭 이벤트, 로딩 상태 검증
// 관련 파일: components/notes/SummaryGenerateButton.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SummaryGenerateButton } from '@/components/notes/SummaryGenerateButton'
import { generateSummary } from '@/app/actions/summaries'
import { toast } from 'sonner'

// Mocks
jest.mock('@/lib/gemini/client', () => ({
  getGeminiClient: jest.fn(),
  DEFAULT_GEMINI_MODEL: 'gemini-2.0-flash-001',
  DEFAULT_GENERATION_CONFIG: {},
}))
jest.mock('@/app/actions/summaries')
jest.mock('sonner')

const mockGenerateSummary = generateSummary as jest.MockedFunction<typeof generateSummary>
const mockToast = toast as jest.Mocked<typeof toast>

describe('SummaryGenerateButton', () => {
  const mockNoteId = 'note-123'
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('기본 상태에서 "AI 요약 생성" 버튼을 렌더링해야 한다', () => {
    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={false}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 생성/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('기존 요약이 있으면 "AI 요약 재생성" 버튼을 렌더링해야 한다', () => {
    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={true}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 재생성/i })
    expect(button).toBeInTheDocument()
  })

  it('버튼 클릭 시 Server Action을 호출해야 한다', async () => {
    mockGenerateSummary.mockResolvedValue({
      success: true,
      summary: {
        id: 'summary-123',
        content: '- 요약 내용',
        model: 'gemini-2.0-flash-001',
        createdAt: new Date(),
      },
    })

    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={false}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockGenerateSummary).toHaveBeenCalledWith(mockNoteId)
    })
  })

  it('로딩 중에는 버튼이 비활성화되고 "요약 생성 중..." 텍스트가 표시되어야 한다', async () => {
    mockGenerateSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    )

    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={false}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 생성/i })
    fireEvent.click(button)

    // 로딩 상태 확인
    await waitFor(() => {
      expect(screen.getByText(/요약 생성 중.../i)).toBeInTheDocument()
    })

    const loadingButton = screen.getByRole('button')
    expect(loadingButton).toBeDisabled()
  })

  it('성공 시 Toast 알림을 표시하고 onSuccess를 호출해야 한다', async () => {
    mockGenerateSummary.mockResolvedValue({
      success: true,
      summary: {
        id: 'summary-123',
        content: '- 요약 내용',
        model: 'gemini-2.0-flash-001',
        createdAt: new Date(),
      },
    })

    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={false}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('요약이 생성되었습니다.')
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('실패 시 Toast 에러 알림을 표시해야 한다', async () => {
    const errorMessage = '요약 생성에 실패했습니다.'
    mockGenerateSummary.mockResolvedValue({
      success: false,
      error: errorMessage,
    })

    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={false}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage)
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  it('기존 요약 업데이트 시 적절한 성공 메시지를 표시해야 한다', async () => {
    mockGenerateSummary.mockResolvedValue({
      success: true,
      summary: {
        id: 'summary-123',
        content: '- 업데이트된 요약',
        model: 'gemini-2.0-flash-001',
        createdAt: new Date(),
      },
    })

    render(
      <SummaryGenerateButton
        noteId={mockNoteId}
        hasExistingSummary={true}
        onSuccess={mockOnSuccess}
      />
    )

    const button = screen.getByRole('button', { name: /AI 요약 재생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('요약이 업데이트되었습니다.')
    })
  })
})

