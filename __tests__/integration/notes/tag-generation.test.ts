// __tests__/integration/notes/tag-generation.test.ts
// AI 태그 생성 통합 테스트
// 전체 태그 생성 플로우와 UI 컴포넌트 검증
// 관련 파일: app/actions/tags.ts, components/notes/TagSection.tsx

import { generateTags, getTags } from '@/app/actions/tags'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { generateText } from '@/lib/gemini/generateText'

// Mocks
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}))
jest.mock('@/lib/gemini/generateText')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>

describe('AI 태그 생성 통합 테스트', () => {
  const mockUser = { id: 'user-123' }
  const mockNoteId = 'note-456'
  const mockNote = {
    id: mockNoteId,
    userId: mockUser.id,
    title: '테스트 노트',
    content: '이것은 AI 태그 생성을 위한 테스트 노트입니다. 충분히 긴 내용을 가지고 있어야 태그를 생성할 수 있습니다. 최소 50자 이상의 텍스트가 필요하며, 다양한 주제와 키워드를 포함하고 있습니다.',
    createdAt: new Date(),
    updatedAt: new Date(),
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

  it('전체 태그 생성 플로우가 정상적으로 동작해야 한다', async () => {
    // 1. 노트 조회 Mock
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

    // 2. Gemini API 호출 Mock
    mockGenerateText.mockResolvedValue({
      success: true,
      text: 'AI, 테스트, 개발, 태그, 자동화, 노트',
    })

    // 3. 기존 태그 삭제 Mock
    const mockDeleteWhere = jest.fn().mockResolvedValue(undefined)
    ;(db.delete as jest.Mock).mockReturnValue({
      where: mockDeleteWhere,
    })

    // 4. 새 태그 삽입 Mock
    const mockInsertValues = jest.fn().mockResolvedValue(undefined)
    ;(db.insert as jest.Mock).mockReturnValue({
      values: mockInsertValues,
    })

    // 5. 태그 생성 실행
    const generateResult = await generateTags(mockNoteId)

    expect(generateResult.success).toBe(true)
    expect(generateResult.tags).toEqual(['AI', '테스트', '개발', '태그', '자동화', '노트'])

    // 6. 생성된 태그 조회 테스트
    const mockTags = [
      { tag: 'AI' },
      { tag: '테스트' },
      { tag: '개발' },
      { tag: '태그' },
      { tag: '자동화' },
      { tag: '노트' },
    ]

    const mockGetTagsLimit = jest.fn()
      .mockResolvedValueOnce([{ id: mockNoteId }]) // 노트 확인
      .mockResolvedValueOnce(mockTags) // 태그 조회

    const mockGetTagsWhere = jest.fn().mockReturnValue({
      limit: mockGetTagsLimit,
    })
    const mockGetTagsFrom = jest.fn().mockReturnValue({
      where: mockGetTagsWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockGetTagsFrom,
    })

    const getResult = await getTags(mockNoteId)

    expect(getResult.success).toBe(true)
    expect(getResult.tags).toEqual(['AI', '테스트', '개발', '태그', '자동화', '노트'])
  })

  it('태그 생성 실패 시 적절한 에러 처리가 되어야 한다', async () => {
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
      error: 'API 호출 실패',
    })

    const result = await generateTags(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('태그 생성에 실패했습니다')
  })

  it('노트 내용이 짧을 때 적절한 에러 메시지를 반환해야 한다', async () => {
    const shortNote = { ...mockNote, content: '짧은 내용' }

    // Mock: 노트 조회
    const mockLimit = jest.fn().mockResolvedValue([shortNote])
    const mockWhere = jest.fn().mockReturnValue({
      limit: mockLimit,
    })
    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    const result = await generateTags(mockNoteId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('노트 내용이 너무 짧습니다')
    expect(result.error).toContain('최소 50자 이상')
  })

  it('권한 없는 사용자가 접근할 때 적절한 에러를 반환해야 한다', async () => {
    // Mock: 인증 실패
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    } as any)

    const generateResult = await generateTags(mockNoteId)
    const getResult = await getTags(mockNoteId)

    expect(generateResult.success).toBe(false)
    expect(generateResult.error).toBe('로그인이 필요합니다.')
    expect(getResult.success).toBe(false)
    expect(getResult.error).toBe('로그인이 필요합니다.')
  })

  it('AI 응답에서 태그 파싱이 정상적으로 동작해야 한다', async () => {
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

    // Mock: 다양한 형식의 AI 응답 테스트
    const testCases = [
      {
        input: '개발, 테스트, AI',
        expected: ['개발', '테스트', 'AI'],
      },
      {
        input: '개발, 테스트, AI, 태그, 자동화',
        expected: ['개발', '테스트', 'AI', '태그', '자동화'],
      },
      {
        input: '- 개발\n- 테스트\n- AI',
        expected: ['개발', '테스트', 'AI'],
      },
    ]

    for (const testCase of testCases) {
      mockGenerateText.mockResolvedValue({
        success: true,
        text: testCase.input,
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
      expect(result.tags).toEqual(testCase.expected)
    }
  })
})
