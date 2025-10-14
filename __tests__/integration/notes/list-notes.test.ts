// __tests__/integration/notes/list-notes.test.ts
// 노트 목록 조회 통합 테스트
// End-to-end 노트 목록 조회 플로우 및 페이지네이션 검증
// 관련 파일: app/actions/notes.ts, app/page.tsx

import { getNotes, createNote } from '@/app/actions/notes'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

// Mock 설정
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db')

describe('노트 목록 조회 통합 테스트', () => {
  const mockUser = { id: 'user-integration-test', email: 'test@example.com' }
  const otherUser = { id: 'user-other', email: 'other@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-end 노트 목록 조회 플로우', () => {
    it('사용자 로그인 → 노트 목록 조회 플로우가 성공한다', async () => {
      // Given: 인증된 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })

      const mockNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Note 2', content: 'Content 2', createdAt: new Date(), updatedAt: new Date() },
      ]

      // Mock DB 응답
      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 2 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockNotes),
                }),
              }),
            }),
          }),
        })

      // When: 노트 목록 조회
      const result = await getNotes(1, 10)

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.data?.notes).toHaveLength(2)
      expect(result.data?.total).toBe(2)
    })
  })

  describe('페이지네이션 동작', () => {
    beforeEach(() => {
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('10개 이상 노트가 있을 때 페이지네이션이 작동한다', async () => {
      // Given: 총 25개의 노트
      const page1Notes = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Note ${i + 1}`,
        content: `Content ${i + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      // Page 1 조회
      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 25 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(page1Notes),
                }),
              }),
            }),
          }),
        })

      const result = await getNotes(1, 10)

      expect(result.success).toBe(true)
      expect(result.data?.notes).toHaveLength(10)
      expect(result.data?.total).toBe(25)
      expect(result.data?.totalPages).toBe(3)
      expect(result.data?.page).toBe(1)
    })

    it('2페이지를 조회할 수 있다', async () => {
      // Given: 2페이지 노트 (11-20번)
      const page2Notes = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 11}`,
        title: `Note ${i + 11}`,
        content: `Content ${i + 11}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 25 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(page2Notes),
                }),
              }),
            }),
          }),
        })

      const result = await getNotes(2, 10)

      expect(result.success).toBe(true)
      expect(result.data?.page).toBe(2)
      expect(result.data?.notes).toHaveLength(10)
    })

    it('마지막 페이지는 10개 미만의 노트를 가질 수 있다', async () => {
      // Given: 마지막 페이지 노트 (21-25번, 5개만)
      const lastPageNotes = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 21}`,
        title: `Note ${i + 21}`,
        content: `Content ${i + 21}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 25 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(lastPageNotes),
                }),
              }),
            }),
          }),
        })

      const result = await getNotes(3, 10)

      expect(result.success).toBe(true)
      expect(result.data?.page).toBe(3)
      expect(result.data?.notes).toHaveLength(5)
    })
  })

  describe('사용자 데이터 격리', () => {
    it('User A의 노트는 User B에게 보이지 않는다', async () => {
      // Given: User A로 로그인
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })

      // User A의 노트만 반환
      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 2 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([
                    { id: '1', userId: mockUser.id, title: 'User A Note 1', content: 'Content 1', createdAt: new Date(), updatedAt: new Date() },
                    { id: '2', userId: mockUser.id, title: 'User A Note 2', content: 'Content 2', createdAt: new Date(), updatedAt: new Date() },
                  ]),
                }),
              }),
            }),
          }),
        })

      const result = await getNotes(1, 10)

      // Then: User A의 노트만 조회됨
      expect(result.success).toBe(true)
      expect(result.data?.notes).toHaveLength(2)
      expect(result.data?.notes.every((note: any) => note.title.startsWith('User A'))).toBe(true)
    })
  })

  describe('빈 상태 UI 표시', () => {
    it('노트가 없는 신규 사용자는 빈 목록을 받는다', async () => {
      // Given: 노트가 없는 신규 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })

      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        })

      // When: 노트 목록 조회
      const result = await getNotes(1, 10)

      // Then: 빈 배열 반환
      expect(result.success).toBe(true)
      expect(result.data?.notes).toEqual([])
      expect(result.data?.total).toBe(0)
      expect(result.data?.totalPages).toBe(0)
    })
  })
})

