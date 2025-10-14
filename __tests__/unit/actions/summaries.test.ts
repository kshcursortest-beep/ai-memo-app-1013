// __tests__/unit/actions/summaries.test.ts
// AI 요약 Server Actions 단위 테스트
// 요약 생성 및 조회 기능 검증
// 관련 파일: app/actions/summaries.ts

import { generateSummary, getSummary } from '@/app/actions/summaries'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { generateText } from '@/lib/gemini/generateText'

// Mocks
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}))
jest.mock('@/lib/gemini/client', () => ({
  getGeminiClient: jest.fn(),
  DEFAULT_GEMINI_MODEL: 'gemini-2.0-flash-001',
  DEFAULT_GENERATION_CONFIG: {},
}))
jest.mock('@/lib/gemini/generateText')
jest.mock('@/lib/gemini/prompts', () => ({
  createSummaryPrompt: jest.fn((content) => `Summarize: ${content}`),
  truncateNoteContent: jest.fn((content) => content),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>

describe('generateSummary', () => {
  const mockUser = { id: 'user-123' }
  const mockNoteId = 'note-456'
  const mockNote = {
    id: mockNoteId,
    userId: mockUser.id,
    title: 'Test Note',
    content: '이것은 테스트 노트입니다. 충분히 긴 내용을 가지고 있어야 요약을 생성할 수 있습니다. 최소 50자 이상의 텍스트가 필요합니다.',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const mockSummary = {
    id: 'summary-789',
    noteId: mockNoteId,
    model: 'gemini-2.0-flash-001',
    content: '- 테스트 노트입니다\n- 요약 내용입니다\n- 핵심 정보입니다',
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Supabase Auth Mock
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any)
  })

  it('정상적으로 요약을 생성해야 한다', async () => {
    // Mock: 노트 조회 및 기존 요약 확인
    const mockLimit = jest.fn()
      .mockResolvedValueOnce([mockNote]) // 노트 조회 성공
      .mockResolvedValueOnce([]) // 기존 요약 없음

    const mockWhere = jest.fn().mockReturnValue({
      limit: mockLimit,
    })

    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    // Mock: Gemini API 호출
    mockGenerateText.mockResolvedValue({
      success: true,
      text: mockSummary.content,
    })

    // Mock: 요약 삽입
    const mockReturning = jest.fn().mockResolvedValue([mockSummary])
    const mockValues = jest.fn().mockReturnValue({
      returning: mockReturning,
    })
    ;(db.insert as jest.Mock).mockReturnValue({
      values: mockValues,
    })

    const result = await generateSummary(mockNoteId)

    if (!result.success) {
      console.error('Test failed with error:', result.error)
    }

    expect(result.success).toBe(true)
    expect(result.summary).toBeDefined()
    expect(result.summary?.content).toBe(mockSummary.content)
    expect(mockGenerateText).toHaveBeenCalled()
  })

  it('노트 내용이 짧은 경우 에러를 반환해야 한다', async () => {
    const shortNote = { ...mockNote, content: '짧은 내용' }

    // Mock: 노트 조회
    const mockSelect = jest.fn().mockReturnThis()
    const mockFrom = jest.fn().mockReturnThis()
    const mockWhere = jest.fn().mockReturnThis()
    const mockLimit = jest.fn().mockResolvedValue([shortNote])

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    })

    const result = await generateSummary(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('너무 짧습니다')
  })

  it('권한 없는 사용자 접근 시 에러를 반환해야 한다', async () => {
    // Mock: 인증 실패
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    } as any)

    const result = await generateSummary(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('로그인이 필요합니다.')
  })

  it('기존 요약이 있으면 업데이트해야 한다', async () => {
    // Mock: 노트 조회 및 기존 요약 확인
    const mockLimit = jest.fn()
      .mockResolvedValueOnce([mockNote]) // 노트 조회 성공
      .mockResolvedValueOnce([mockSummary]) // 기존 요약 있음

    const mockWhere = jest.fn().mockReturnValue({
      limit: mockLimit,
    })

    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    // Mock: Gemini API 호출
    const newSummaryContent = '- 업데이트된 요약\n- 새로운 내용'
    mockGenerateText.mockResolvedValue({
      success: true,
      text: newSummaryContent,
    })

    // Mock: 요약 업데이트
    const updatedSummary = { ...mockSummary, content: newSummaryContent }
    const mockReturning = jest.fn().mockResolvedValue([updatedSummary])
    const mockUpdateWhere = jest.fn().mockReturnValue({
      returning: mockReturning,
    })
    const mockSet = jest.fn().mockReturnValue({
      where: mockUpdateWhere,
    })
    ;(db.update as jest.Mock).mockReturnValue({
      set: mockSet,
    })

    const result = await generateSummary(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.summary?.content).toBe(newSummaryContent)
    expect(db.update).toHaveBeenCalled()
  })
})

describe('getSummary', () => {
  const mockUser = { id: 'user-123' }
  const mockNoteId = 'note-456'
  const mockSummary = {
    id: 'summary-789',
    noteId: mockNoteId,
    model: 'gemini-2.0-flash-001',
    content: '- 테스트 요약',
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Supabase Auth Mock
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any)
  })

  it('요약을 조회할 수 있어야 한다', async () => {
    // Mock: 노트 소유자 확인
    const mockSelect = jest.fn().mockReturnThis()
    const mockFrom = jest.fn().mockReturnThis()
    const mockWhere = jest.fn().mockReturnThis()
    const mockLimit = jest.fn()
      .mockResolvedValueOnce([{ id: mockNoteId }]) // 노트 확인
      .mockResolvedValueOnce([mockSummary]) // 요약 조회

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    })

    const result = await getSummary(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.summary).toBeDefined()
    expect(result.summary?.content).toBe(mockSummary.content)
  })

  it('요약이 없는 경우 null을 반환해야 한다', async () => {
    // Mock: 노트 소유자 확인
    const mockSelect = jest.fn().mockReturnThis()
    const mockFrom = jest.fn().mockReturnThis()
    const mockWhere = jest.fn().mockReturnThis()
    const mockLimit = jest.fn()
      .mockResolvedValueOnce([{ id: mockNoteId }]) // 노트 확인
      .mockResolvedValueOnce([]) // 요약 없음

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    })

    const result = await getSummary(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.summary).toBeNull()
  })
})

