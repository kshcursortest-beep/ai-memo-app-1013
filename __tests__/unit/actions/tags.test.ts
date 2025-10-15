// __tests__/unit/actions/tags.test.ts
// AI 태그 Server Actions 단위 테스트
// 태그 생성, 조회, 삭제 기능 검증
// 관련 파일: app/actions/tags.ts

import { generateTags, getTags, deleteTags } from '@/app/actions/tags'
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
    delete: jest.fn(),
  },
}))
jest.mock('@/lib/gemini/client', () => ({
  getGeminiClient: jest.fn(),
  DEFAULT_GEMINI_MODEL: 'gemini-2.0-flash-001',
  DEFAULT_GENERATION_CONFIG: {},
}))
jest.mock('@/lib/gemini/generateText')
jest.mock('@/lib/gemini/prompts', () => ({
  createTagPrompt: jest.fn((content) => `Generate tags: ${content}`),
  truncateNoteContent: jest.fn((content) => content),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>

describe('generateTags', () => {
  const mockUser = { id: 'user-123' }
  const mockNoteId = 'note-456'
  const mockNote = {
    id: mockNoteId,
    userId: mockUser.id,
    title: 'Test Note',
    content: '이것은 테스트 노트입니다. 충분히 긴 내용을 가지고 있어야 태그를 생성할 수 있습니다. 최소 50자 이상의 텍스트가 필요합니다.',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const mockTags = ['테스트', '개발', 'AI', '태그']

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

  it('정상적으로 태그를 생성해야 한다', async () => {
    // Mock: 노트 조회
    const mockLimit = jest.fn().mockResolvedValue([mockNote])
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
      text: '테스트, 개발, AI, 태그',
    })

    // Mock: 기존 태그 삭제
    const mockDeleteWhere = jest.fn().mockResolvedValue(undefined)
    ;(db.delete as jest.Mock).mockReturnValue({
      where: mockDeleteWhere,
    })

    // Mock: 새 태그 삽입
    const mockInsertValues = jest.fn().mockResolvedValue(undefined)
    ;(db.insert as jest.Mock).mockReturnValue({
      values: mockInsertValues,
    })

    const result = await generateTags(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.tags).toEqual(['테스트', '개발', 'AI', '태그'])
    expect(mockGenerateText).toHaveBeenCalled()
    expect(db.delete).toHaveBeenCalled()
    expect(db.insert).toHaveBeenCalled()
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

    const result = await generateTags(mockNoteId)

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

    const result = await generateTags(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('로그인이 필요합니다.')
  })

  it('AI 응답이 비어있는 경우 에러를 반환해야 한다', async () => {
    // Mock: 노트 조회
    const mockLimit = jest.fn().mockResolvedValue([mockNote])
    const mockWhere = jest.fn().mockReturnValue({
      limit: mockLimit,
    })
    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    // Mock: Gemini API 호출 실패
    mockGenerateText.mockResolvedValue({
      success: false,
      error: 'AI 응답이 비어있습니다.',
    })

    const result = await generateTags(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('AI 응답이 비어있습니다')
  })

  it('태그 개수를 최대 6개로 제한해야 한다', async () => {
    // Mock: 노트 조회
    const mockLimit = jest.fn().mockResolvedValue([mockNote])
    const mockWhere = jest.fn().mockReturnValue({
      limit: mockLimit,
    })
    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    // Mock: Gemini API 호출 (7개 태그 반환)
    mockGenerateText.mockResolvedValue({
      success: true,
      text: '태그1, 태그2, 태그3, 태그4, 태그5, 태그6, 태그7',
    })

    // Mock: 기존 태그 삭제
    const mockDeleteWhere = jest.fn().mockResolvedValue(undefined)
    ;(db.delete as jest.Mock).mockReturnValue({
      where: mockDeleteWhere,
    })

    // Mock: 새 태그 삽입
    const mockInsertValues = jest.fn().mockResolvedValue(undefined)
    ;(db.insert as jest.Mock).mockReturnValue({
      values: mockInsertValues,
    })

    const result = await generateTags(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.tags).toHaveLength(6)
    expect(result.tags).toEqual(['태그1', '태그2', '태그3', '태그4', '태그5', '태그6'])
  })
})

describe('getTags', () => {
  const mockUser = { id: 'user-123' }
  const mockNoteId = 'note-456'
  const mockTags = [
    { tag: '테스트' },
    { tag: '개발' },
    { tag: 'AI' },
  ]

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

  it('태그를 조회할 수 있어야 한다', async () => {
    // Mock: 노트 소유자 확인
    const mockFirstLimit = jest.fn().mockResolvedValue([{ id: mockNoteId }])
    const mockFirstWhere = jest.fn().mockReturnValue({
      limit: mockFirstLimit,
    })
    const mockFirstFrom = jest.fn().mockReturnValue({
      where: mockFirstWhere,
    })

    // Mock: 태그 조회
    const mockSecondLimit = jest.fn().mockResolvedValue(mockTags)
    const mockSecondWhere = jest.fn().mockReturnValue({
      limit: mockSecondLimit,
    })
    const mockSecondFrom = jest.fn().mockReturnValue({
      where: mockSecondWhere,
    })

    ;(db.select as jest.Mock)
      .mockReturnValueOnce({
        from: mockFirstFrom,
      })
      .mockReturnValueOnce({
        from: mockSecondFrom,
      })

    const result = await getTags(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.tags).toEqual(['테스트', '개발', 'AI'])
  })

  it('태그가 없는 경우 빈 배열을 반환해야 한다', async () => {
    // Mock: 첫 번째 호출 (노트 소유자 확인)
    const mockFirstLimit = jest.fn().mockResolvedValue([{ id: mockNoteId }])
    const mockFirstWhere = jest.fn().mockReturnValue({
      limit: mockFirstLimit,
    })
    const mockFirstFrom = jest.fn().mockReturnValue({
      where: mockFirstWhere,
    })

    // Mock: 두 번째 호출 (태그 조회 - 빈 배열)
    const mockSecondLimit = jest.fn().mockResolvedValue([])
    const mockSecondWhere = jest.fn().mockReturnValue({
      limit: mockSecondLimit,
    })
    const mockSecondFrom = jest.fn().mockReturnValue({
      where: mockSecondWhere,
    })

    ;(db.select as jest.Mock)
      .mockReturnValueOnce({
        from: mockFirstFrom,
      })
      .mockReturnValueOnce({
        from: mockSecondFrom,
      })

    const result = await getTags(mockNoteId)

    expect(result.success).toBe(true)
    expect(result.tags).toEqual([])
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

    const result = await getTags(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('로그인이 필요합니다.')
  })
})

describe('deleteTags', () => {
  const mockUser = { id: 'user-123' }
  const mockNoteId = 'note-456'

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

  it('태그를 삭제할 수 있어야 한다', async () => {
    // Mock: 노트 소유자 확인
    const mockLimit = jest.fn().mockResolvedValue([{ id: mockNoteId }])
    const mockWhere = jest.fn().mockReturnValue({
      limit: mockLimit,
    })
    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    // Mock: 태그 삭제
    const mockDeleteWhere = jest.fn().mockResolvedValue(undefined)
    ;(db.delete as jest.Mock).mockReturnValue({
      where: mockDeleteWhere,
    })

    const result = await deleteTags(mockNoteId)

    expect(result.success).toBe(true)
    expect(db.delete).toHaveBeenCalled()
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

    const result = await deleteTags(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('로그인이 필요합니다.')
  })
})
