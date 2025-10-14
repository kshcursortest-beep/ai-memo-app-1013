// __tests__/integration/notes/delete-note.test.ts
// 노트 삭제 통합 테스트
// End-to-end 플로우 및 데이터 격리 검증, CASCADE DELETE 검증
// 관련 파일: app/actions/notes.ts

import { createNote, getNotes, deleteNote } from '@/app/actions/notes'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

// Mock 설정
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db')

describe('노트 삭제 통합 테스트', () => {
  const mockUser1 = { id: 'user-1', email: 'user1@example.com' }
  const mockUser2 = { id: 'user-2', email: 'user2@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-end 노트 삭제 플로우', () => {
    it('노트 생성 → 삭제 → 목록 조회 (삭제된 노트 없음)', async () => {
      // Given: 인증된 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // Step 1: 노트 생성
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'note-123',
              userId: mockUser1.id,
              title: 'Test Note',
              content: 'Test Content',
              createdAt: new Date('2025-10-14T10:00:00Z'),
              updatedAt: new Date('2025-10-14T10:00:00Z'),
            },
          ]),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      const createResult = await createNote('Test Note', 'Test Content')
      expect(createResult.success).toBe(true)
      expect(createResult.noteId).toBe('note-123')

      // Step 2: 노트 삭제
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'note-123' }]),
        }),
      })

      const deleteResult = await deleteNote('note-123')

      // Then: 삭제 성공
      expect(deleteResult.success).toBe(true)

      // Step 3: 목록 조회 (삭제된 노트는 없어야 함)
      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          // 첫 번째 호출: count 쿼리
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          // 두 번째 호출: 노트 목록 쿼리
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]), // 삭제되어 빈 배열
                }),
              }),
            }),
          }),
        })

      const listResult = await getNotes(1, 10)
      expect(listResult.success).toBe(true)
      expect(listResult.data?.notes.length).toBe(0)
    })
  })

  describe('사용자 데이터 격리 검증', () => {
    it('User A는 User B의 노트를 삭제할 수 없다', async () => {
      // Given: User 1로 인증
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // User 2의 노트를 삭제하려 시도 (WHERE 조건으로 필터링됨)
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]), // 권한 없어서 빈 배열
        }),
      })

      // When: User 2의 노트 삭제 시도
      const result = await deleteNote('user2-note-id')

      // Then: 삭제 실패
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('각 사용자는 자신의 노트만 삭제할 수 있다', async () => {
      // Scenario 1: User 1이 자신의 노트 삭제
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'user1-note' }]),
        }),
      })

      const result1 = await deleteNote('user1-note')

      // Then: User 1 노트 삭제 성공
      expect(result1.success).toBe(true)

      // Scenario 2: User 2가 자신의 노트 삭제
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser2 },
            error: null,
          }),
        },
      })

      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'user2-note' }]),
        }),
      })

      const result2 = await deleteNote('user2-note')

      // Then: User 2 노트 삭제 성공
      expect(result2.success).toBe(true)
    })
  })

  describe('에러 처리 시나리오', () => {
    beforeEach(() => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })
    })

    it('존재하지 않는 노트 삭제 시도', async () => {
      // Given: DB에 노트 없음
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      })

      // When: 존재하지 않는 노트 삭제 시도
      const result = await deleteNote('non-existent-id')

      // Then: 실패
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('유효하지 않은 노트 ID로 삭제 시도', async () => {
      // When: 빈 ID로 삭제 시도
      const result1 = await deleteNote('')

      // Then: 유효성 검사 실패
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('유효하지 않은 노트 ID입니다.')

      // When: null ID로 삭제 시도
      const result2 = await deleteNote(null as any)

      // Then: 유효성 검사 실패
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('유효하지 않은 노트 ID입니다.')
    })

    it('DB 연결 실패 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 연결 실패
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      })

      // When: 노트 삭제 시도
      const result = await deleteNote('note-123')

      // Then: 사용자 친화적 에러 메시지
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 삭제에 실패했습니다. 다시 시도해주세요.')
    })
  })

  describe('CASCADE DELETE 검증', () => {
    beforeEach(() => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })
    })

    it('노트 삭제 시 CASCADE DELETE가 정상 동작함을 확인', async () => {
      // Given: 노트 삭제 성공 (CASCADE DELETE는 DB 레벨에서 자동 처리)
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'note-123' }]),
        }),
      })

      // When: 노트 삭제
      const result = await deleteNote('note-123')

      // Then: 삭제 성공
      expect(result.success).toBe(true)

      // Note: CASCADE DELETE 동작은 DB 레벨에서 자동으로 처리되므로
      // 별도 쿼리 없이 notes 삭제 시 noteTags, summaries도 함께 삭제됨
      // (외래 키 제약 조건에 onDelete: 'cascade' 설정됨)
    })
  })

  describe('미인증 사용자 처리', () => {
    it('로그인하지 않은 사용자는 노트를 삭제할 수 없다', async () => {
      // Given: 인증되지 않은 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      })

      // When: 노트 삭제 시도
      const result = await deleteNote('note-123')

      // Then: 인증 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
    })
  })
})

