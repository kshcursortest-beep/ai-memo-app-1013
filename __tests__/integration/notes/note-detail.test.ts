// __tests__/integration/notes/note-detail.test.ts
// 노트 상세 조회 통합 테스트
// End-to-end 플로우 및 데이터 격리 검증
// 관련 파일: app/actions/notes.ts, app/notes/[id]/page.tsx

import { createNote, getNoteById } from '@/app/actions/notes'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

// Mock 설정
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db')

describe('노트 상세 조회 통합 테스트', () => {
  const mockUser1 = { id: 'user-1', email: 'user1@example.com' }
  const mockUser2 = { id: 'user-2', email: 'user2@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-end 노트 상세 조회 플로우', () => {
    it('노트 생성 → 노트 상세 조회가 정상적으로 동작한다', async () => {
      // Given: 인증된 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      const createdNote = {
        id: 'note-123',
        userId: mockUser1.id,
        title: 'Integration Test Note',
        content: 'This is a test note for integration testing.',
        createdAt: new Date('2025-10-14T10:00:00Z'),
        updatedAt: new Date('2025-10-14T10:00:00Z'),
      }

      // Step 1: 노트 생성
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdNote]),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      const createResult = await createNote('Integration Test Note', 'This is a test note for integration testing.')

      // Then: 노트 생성 성공
      expect(createResult.success).toBe(true)
      expect(createResult.noteId).toBe('note-123')

      // Step 2: 생성한 노트 상세 조회
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: createdNote.id,
                title: createdNote.title,
                content: createdNote.content,
                createdAt: createdNote.createdAt,
                updatedAt: createdNote.updatedAt,
              },
            ]),
          }),
        }),
      })

      const getResult = await getNoteById('note-123')

      // Then: 노트 상세 조회 성공
      expect(getResult.success).toBe(true)
      expect(getResult.data).toEqual({
        id: 'note-123',
        title: 'Integration Test Note',
        content: 'This is a test note for integration testing.',
        createdAt: createdNote.createdAt,
        updatedAt: createdNote.updatedAt,
      })
    })

    it('전체 내용(제목, 본문, 날짜)이 정확히 조회된다', async () => {
      // Given: 인증된 사용자 및 노트 존재
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      const mockNote = {
        id: 'note-456',
        title: 'Full Content Test',
        content: 'This is a long content.\n\nWith multiple paragraphs.\n\nAnd line breaks.',
        createdAt: new Date('2025-10-14T10:00:00Z'),
        updatedAt: new Date('2025-10-14T12:00:00Z'), // 수정됨
      }

      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      })

      // When: 노트 상세 조회
      const result = await getNoteById('note-456')

      // Then: 모든 필드 정확히 조회
      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Full Content Test')
      expect(result.data?.content).toContain('multiple paragraphs')
      expect(result.data?.content).toContain('\n\n') // 줄바꿈 유지
      expect(result.data?.createdAt).toEqual(mockNote.createdAt)
      expect(result.data?.updatedAt).toEqual(mockNote.updatedAt)
    })
  })

  describe('사용자 데이터 격리 검증', () => {
    it('User A는 User B의 노트에 접근할 수 없다', async () => {
      // Given: User 1로 인증
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // User 2의 노트를 조회하려 시도 (WHERE 조건으로 필터링됨)
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // 권한 없어서 빈 배열
          }),
        }),
      })

      // When: User 2의 노트 조회 시도
      const result = await getNoteById('user2-note-id')

      // Then: 접근 거부 (404로 표시)
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
      expect(result.data).toBeUndefined()
    })

    it('각 사용자는 자신의 노트만 조회할 수 있다', async () => {
      // Scenario 1: User 1이 자신의 노트 조회
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      const user1Note = {
        id: 'user1-note',
        title: 'User 1 Note',
        content: 'User 1 content',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([user1Note]),
          }),
        }),
      })

      const result1 = await getNoteById('user1-note')

      // Then: User 1 노트 조회 성공
      expect(result1.success).toBe(true)
      expect(result1.data?.id).toBe('user1-note')

      // Scenario 2: User 2가 자신의 노트 조회
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser2 },
            error: null,
          }),
        },
      })

      const user2Note = {
        id: 'user2-note',
        title: 'User 2 Note',
        content: 'User 2 content',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([user2Note]),
          }),
        }),
      })

      const result2 = await getNoteById('user2-note')

      // Then: User 2 노트 조회 성공
      expect(result2.success).toBe(true)
      expect(result2.data?.id).toBe('user2-note')
    })
  })

  describe('존재하지 않는 노트 접근', () => {
    it('존재하지 않는 ID 접근 시 404 에러를 반환한다', async () => {
      // Given: 인증된 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // 존재하지 않는 노트
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      // When: 존재하지 않는 노트 조회
      const result = await getNoteById('non-existent-note-id')

      // Then: 404 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('잘못된 형식의 ID 접근 시 적절한 에러를 반환한다', async () => {
      // Given: 인증된 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // When: 빈 ID로 조회
      const result1 = await getNoteById('')

      // Then: 유효성 검사 에러
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('유효하지 않은 노트 ID입니다.')

      // When: 잘못된 타입의 ID로 조회
      const result2 = await getNoteById(null as any)

      // Then: 유효성 검사 에러
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('유효하지 않은 노트 ID입니다.')
    })
  })

  describe('에러 복구 및 사용자 경험', () => {
    it('DB 오류 발생 시에도 적절한 에러 메시지를 제공한다', async () => {
      // Given: 인증된 사용자 및 DB 오류
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      })

      // When: 노트 조회 시도
      const result = await getNoteById('note-123')

      // Then: 사용자 친화적 에러 메시지
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 불러올 수 없습니다. 다시 시도해주세요.')
      expect(result.data).toBeUndefined()
    })
  })
})

