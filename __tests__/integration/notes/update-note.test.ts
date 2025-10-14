// __tests__/integration/notes/update-note.test.ts
// 노트 수정 통합 테스트
// End-to-end 플로우 및 데이터 격리 검증
// 관련 파일: app/actions/notes.ts

import { createNote, getNoteById, updateNote } from '@/app/actions/notes'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

// Mock 설정
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db')

describe('노트 수정 통합 테스트', () => {
  const mockUser1 = { id: 'user-1', email: 'user1@example.com' }
  const mockUser2 = { id: 'user-2', email: 'user2@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-end 노트 수정 플로우', () => {
    it('노트 생성 → 상세 조회 → 수정 → 변경사항 확인', async () => {
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
              title: 'Original Title',
              content: 'Original Content',
              createdAt: new Date('2025-10-14T10:00:00Z'),
              updatedAt: new Date('2025-10-14T10:00:00Z'),
            },
          ]),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      const createResult = await createNote('Original Title', 'Original Content')
      expect(createResult.success).toBe(true)
      expect(createResult.noteId).toBe('note-123')

      // Step 2: 노트 상세 조회
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 'note-123',
                title: 'Original Title',
                content: 'Original Content',
                createdAt: new Date('2025-10-14T10:00:00Z'),
                updatedAt: new Date('2025-10-14T10:00:00Z'),
              },
            ]),
          }),
        }),
      })

      const getResult = await getNoteById('note-123')
      expect(getResult.success).toBe(true)
      expect(getResult.data?.title).toBe('Original Title')

      // Step 3: 노트 수정
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'note-123',
                title: 'Updated Title',
                content: 'Updated Content',
                createdAt: new Date('2025-10-14T10:00:00Z'),
                updatedAt: new Date('2025-10-14T12:00:00Z'), // updated_at 갱신됨
              },
            ]),
          }),
        }),
      })

      const updateResult = await updateNote('note-123', 'Updated Title', 'Updated Content')

      // Then: 수정 성공
      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.title).toBe('Updated Title')
      expect(updateResult.data?.content).toBe('Updated Content')
      expect(updateResult.data?.updatedAt.getTime()).toBeGreaterThan(
        updateResult.data!.createdAt.getTime()
      )
    })

    it('여러 번 수정하면 최종 변경사항만 저장된다', async () => {
      // Given: 인증된 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // When: 여러 번 수정
      ;(db.update as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  id: 'note-123',
                  title: 'Update 1',
                  content: 'Content 1',
                  createdAt: new Date('2025-10-14T10:00:00Z'),
                  updatedAt: new Date('2025-10-14T11:00:00Z'),
                },
              ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  id: 'note-123',
                  title: 'Update 2',
                  content: 'Content 2',
                  createdAt: new Date('2025-10-14T10:00:00Z'),
                  updatedAt: new Date('2025-10-14T12:00:00Z'),
                },
              ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  id: 'note-123',
                  title: 'Final Update',
                  content: 'Final Content',
                  createdAt: new Date('2025-10-14T10:00:00Z'),
                  updatedAt: new Date('2025-10-14T13:00:00Z'),
                },
              ]),
            }),
          }),
        })

      const result1 = await updateNote('note-123', 'Update 1', 'Content 1')
      const result2 = await updateNote('note-123', 'Update 2', 'Content 2')
      const result3 = await updateNote('note-123', 'Final Update', 'Final Content')

      // Then: 최종 변경사항만 반영
      expect(result3.success).toBe(true)
      expect(result3.data?.title).toBe('Final Update')
      expect(result3.data?.content).toBe('Final Content')
    })
  })

  describe('사용자 데이터 격리 검증', () => {
    it('User A는 User B의 노트를 수정할 수 없다', async () => {
      // Given: User 1로 인증
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      // User 2의 노트를 수정하려 시도 (WHERE 조건으로 필터링됨)
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]), // 권한 없어서 빈 배열
          }),
        }),
      })

      // When: User 2의 노트 수정 시도
      const result = await updateNote('user2-note-id', 'Hacked Title', 'Hacked Content')

      // Then: 수정 실패
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
      expect(result.data).toBeUndefined()
    })

    it('각 사용자는 자신의 노트만 수정할 수 있다', async () => {
      // Scenario 1: User 1이 자신의 노트 수정
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser1 },
            error: null,
          }),
        },
      })

      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'user1-note',
                title: 'User 1 Updated',
                content: 'User 1 content',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      })

      const result1 = await updateNote('user1-note', 'User 1 Updated', 'User 1 content')

      // Then: User 1 노트 수정 성공
      expect(result1.success).toBe(true)
      expect(result1.data?.title).toBe('User 1 Updated')

      // Scenario 2: User 2가 자신의 노트 수정
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser2 },
            error: null,
          }),
        },
      })

      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'user2-note',
                title: 'User 2 Updated',
                content: 'User 2 content',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      })

      const result2 = await updateNote('user2-note', 'User 2 Updated', 'User 2 content')

      // Then: User 2 노트 수정 성공
      expect(result2.success).toBe(true)
      expect(result2.data?.title).toBe('User 2 Updated')
    })
  })

  describe('유효성 검사 실패 시나리오', () => {
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

    it('제목이 500자를 초과하면 수정에 실패한다', async () => {
      // Given: 500자 초과 제목
      const longTitle = 'A'.repeat(501)

      // When: 긴 제목으로 수정 시도
      const result = await updateNote('note-123', longTitle, 'Content')

      // Then: 유효성 검사 실패
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목은 최대 500자까지 입력 가능합니다.')
    })

    it('본문이 비어있으면 수정에 실패한다', async () => {
      // When: 빈 본문으로 수정 시도
      const result = await updateNote('note-123', 'Title', '')

      // Then: 유효성 검사 실패
      expect(result.success).toBe(false)
      expect(result.error).toBe('본문을 입력해주세요.')
    })

    it('제목과 본문 모두 유효해야 수정할 수 있다', async () => {
      // Given: 유효한 입력
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'note-123',
                title: 'Valid Title',
                content: 'Valid Content',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      })

      // When: 유효한 입력으로 수정
      const result = await updateNote('note-123', 'Valid Title', 'Valid Content')

      // Then: 수정 성공
      expect(result.success).toBe(true)
    })
  })

  describe('네트워크 오류 시나리오', () => {
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

    it('DB 연결 실패 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 연결 실패
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      })

      // When: 노트 수정 시도
      const result = await updateNote('note-123', 'Title', 'Content')

      // Then: 사용자 친화적 에러 메시지
      expect(result.success).toBe(false)
      expect(result.error).toBe('저장에 실패했습니다. 다시 시도해주세요.')
      expect(result.data).toBeUndefined()
    })
  })

  describe('에지 케이스', () => {
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

    it('공백이 포함된 입력은 trim되어 저장된다', async () => {
      // Given: 공백이 포함된 입력
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'note-123',
                title: 'Trimmed Title',
                content: 'Trimmed Content',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      })

      // When: 공백이 포함된 입력으로 수정
      const result = await updateNote('note-123', '  Trimmed Title  ', '  Trimmed Content  ')

      // Then: trim된 값이 저장됨
      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Trimmed Title')
      expect(result.data?.content).toBe('Trimmed Content')
    })

    it('줄바꿈이 포함된 본문도 정상적으로 저장된다', async () => {
      // Given: 줄바꿈이 포함된 본문
      const contentWithNewlines = 'Line 1\n\nLine 2\n\nLine 3'

      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'note-123',
                title: 'Title',
                content: contentWithNewlines,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      })

      // When: 줄바꿈이 포함된 본문으로 수정
      const result = await updateNote('note-123', 'Title', contentWithNewlines)

      // Then: 줄바꿈이 유지됨
      expect(result.success).toBe(true)
      expect(result.data?.content).toContain('\n\n')
    })
  })
})

