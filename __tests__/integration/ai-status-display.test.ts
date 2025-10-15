// __tests__/integration/ai-status-display.test.ts
// AI 상태 표시 통합 테스트
// SummarySection, TagSection, TempTagGenerator의 상태 표시 기능 테스트
// 관련 파일: components/notes/SummarySection.tsx, components/notes/TagSection.tsx, components/notes/TempTagGenerator.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SummarySection } from '@/components/notes/SummarySection'
import { TagSection } from '@/components/notes/TagSection'
import { TempTagGenerator } from '@/components/notes/TempTagGenerator'
import { generateSummary } from '@/app/actions/summaries'
import { generateTags } from '@/app/actions/tags'
import { generateTempTags } from '@/app/actions/tags'

// Mock Server Actions
jest.mock('@/app/actions/summaries')
jest.mock('@/app/actions/tags')

const mockGenerateSummary = generateSummary as jest.MockedFunction<typeof generateSummary>
const mockGenerateTags = generateTags as jest.MockedFunction<typeof generateTags>
const mockGenerateTempTags = generateTempTags as jest.MockedFunction<typeof generateTempTags>

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

describe('AI Status Display Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SummarySection', () => {
    const mockNoteId = 'test-note-id'

    it('요약 생성 시 로딩 상태를 표시해야 한다', async () => {
      mockGenerateSummary.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          summary: {
            id: 'summary-id',
            content: '테스트 요약',
            model: 'gemini-pro',
            createdAt: new Date(),
          },
        }), 1000))
      )

      render(<SummarySection noteId={mockNoteId} />)

      const generateButton = screen.getByText(/AI 요약 생성/)
      fireEvent.click(generateButton)

      // 로딩 상태 확인
      expect(screen.getByText('요약 생성을 준비하고 있습니다...')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })

    it('요약 생성 성공 시 성공 상태를 표시해야 한다', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: true,
        summary: {
          id: 'summary-id',
          content: '테스트 요약',
          model: 'gemini-pro',
          createdAt: new Date(),
        },
      })

      render(<SummarySection noteId={mockNoteId} />)

      const generateButton = screen.getByText(/AI 요약 생성/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('AI 처리가 완료되었습니다')).toBeInTheDocument()
      })
    })

    it('요약 생성 실패 시 에러 상태를 표시해야 한다', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: false,
        error: '요약 생성 실패',
        aiError: {
          type: 'API' as any,
          message: 'AI 서비스에 일시적인 문제가 발생했습니다.',
          action: 'retry',
        },
      })

      render(<SummarySection noteId={mockNoteId} />)

      const generateButton = screen.getByText(/AI 요약 생성/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('AI 서비스에 일시적인 문제가 발생했습니다.')).toBeInTheDocument()
        expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
      })
    })

    it('재시도 버튼이 작동해야 한다', async () => {
      mockGenerateSummary.mockResolvedValue({
        success: false,
        error: '요약 생성 실패',
        aiError: {
          type: 'API' as any,
          message: 'AI 서비스에 일시적인 문제가 발생했습니다.',
          action: 'retry',
        },
      })

      render(<SummarySection noteId={mockNoteId} />)

      const generateButton = screen.getByText(/AI 요약 생성/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('다시 시도 (0/3)')
      fireEvent.click(retryButton)

      // 에러 상태가 초기화되어야 함
      expect(screen.queryByText('AI 서비스에 일시적인 문제가 발생했습니다.')).not.toBeInTheDocument()
    })
  })

  describe('TagSection', () => {
    const mockNoteId = 'test-note-id'
    const mockInitialTags = ['태그1', '태그2']

    it('태그 생성 시 로딩 상태를 표시해야 한다', async () => {
      mockGenerateTags.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          tags: ['새태그1', '새태그2'],
        }), 1000))
      )

      render(<TagSection noteId={mockNoteId} initialTags={mockInitialTags} />)

      const generateButton = screen.getByText(/AI 태그 생성/)
      fireEvent.click(generateButton)

      // 로딩 상태 확인
      expect(screen.getByText('태그 생성을 준비하고 있습니다...')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })

    it('태그 생성 성공 시 성공 상태를 표시해야 한다', async () => {
      mockGenerateTags.mockResolvedValue({
        success: true,
        tags: ['새태그1', '새태그2'],
      })

      render(<TagSection noteId={mockNoteId} initialTags={mockInitialTags} />)

      const generateButton = screen.getByText(/AI 태그 생성/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('AI 처리가 완료되었습니다')).toBeInTheDocument()
      })
    })

    it('태그 생성 실패 시 에러 상태를 표시해야 한다', async () => {
      mockGenerateTags.mockResolvedValue({
        success: false,
        error: '태그 생성 실패',
        aiError: {
          type: 'API' as any,
          message: 'AI 서비스에 일시적인 문제가 발생했습니다.',
          action: 'retry',
        },
      })

      render(<TagSection noteId={mockNoteId} initialTags={mockInitialTags} />)

      const generateButton = screen.getByText(/AI 태그 생성/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('AI 서비스에 일시적인 문제가 발생했습니다.')).toBeInTheDocument()
        expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
      })
    })
  })

  describe('TempTagGenerator', () => {
    const mockContent = '테스트 노트 내용입니다. 이 내용은 충분히 길어서 태그를 생성할 수 있습니다.'

    it('임시 태그 생성 시 로딩 상태를 표시해야 한다', async () => {
      mockGenerateTempTags.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          tags: ['임시태그1', '임시태그2'],
        }), 1000))
      )

      render(<TempTagGenerator content={mockContent} />)

      const generateButton = screen.getByText(/AI 태그 미리보기/)
      fireEvent.click(generateButton)

      // 로딩 상태 확인
      expect(screen.getByText('태그 생성을 준비하고 있습니다...')).toBeInTheDocument()
      expect(screen.getByText('10%')).toBeInTheDocument()
    })

    it('임시 태그 생성 성공 시 성공 상태를 표시해야 한다', async () => {
      mockGenerateTempTags.mockResolvedValue({
        success: true,
        tags: ['임시태그1', '임시태그2'],
      })

      render(<TempTagGenerator content={mockContent} />)

      const generateButton = screen.getByText(/AI 태그 미리보기/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('AI 처리가 완료되었습니다')).toBeInTheDocument()
      })
    })

    it('임시 태그 생성 실패 시 에러 상태를 표시해야 한다', async () => {
      mockGenerateTempTags.mockResolvedValue({
        success: false,
        error: '태그 생성 실패',
        aiError: {
          type: 'API' as any,
          message: 'AI 서비스에 일시적인 문제가 발생했습니다.',
          action: 'retry',
        },
      })

      render(<TempTagGenerator content={mockContent} />)

      const generateButton = screen.getByText(/AI 태그 미리보기/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('AI 서비스에 일시적인 문제가 발생했습니다.')).toBeInTheDocument()
        expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
      })
    })

    it('내용이 짧을 때 태그 생성 버튼이 비활성화되어야 한다', () => {
      render(<TempTagGenerator content="짧은 내용" />)

      const generateButton = screen.getByText(/AI 태그 미리보기/)
      expect(generateButton).toBeDisabled()
      expect(screen.getByText('최소 50자 이상 작성하면 태그를 생성할 수 있습니다.')).toBeInTheDocument()
    })

    it('재시도 버튼이 작동해야 한다', async () => {
      mockGenerateTempTags.mockResolvedValue({
        success: false,
        error: '태그 생성 실패',
        aiError: {
          type: 'API' as any,
          message: 'AI 서비스에 일시적인 문제가 발생했습니다.',
          action: 'retry',
        },
      })

      render(<TempTagGenerator content={mockContent} />)

      const generateButton = screen.getByText(/AI 태그 미리보기/)
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('다시 시도 (0/3)')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('다시 시도 (0/3)')
      fireEvent.click(retryButton)

      // 에러 상태가 초기화되어야 함
      expect(screen.queryByText('AI 서비스에 일시적인 문제가 발생했습니다.')).not.toBeInTheDocument()
    })
  })
})
