// __tests__/unit/actions/regenerations.test.ts
// 재생성 관련 Server Actions 단위 테스트
// 재생성 횟수 제한, 기록 저장, 히스토리 조회 기능 테스트
// 관련 파일: app/actions/regenerations.ts, drizzle/schema.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { 
  checkRegenerationLimit, 
  recordRegeneration, 
  canRegenerateAndRecord,
  getRegenerationHistory 
} from '@/app/actions/regenerations'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db')
jest.mock('@/drizzle/schema')

const mockCreateClient = jest.fn()
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/db', () => ({
  db: mockDb,
}))

jest.mock('@/drizzle/schema', () => ({
  aiRegenerations: {
    userId: 'user_id',
    noteId: 'note_id',
    type: 'type',
    createdAt: 'created_at',
  },
}))

describe('regenerations actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkRegenerationLimit', () => {
    it('인증되지 않은 사용자는 재생성할 수 없어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      })

      const result = await checkRegenerationLimit('user-id', 'summary')

      expect(result.canRegenerate).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('오늘 재생성 횟수가 제한을 초과하면 재생성할 수 없어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      })

      const result = await checkRegenerationLimit('user-id', 'summary')

      expect(result.canRegenerate).toBe(false)
      expect(result.currentCount).toBe(10)
      expect(result.limit).toBe(10)
    })

    it('오늘 재생성 횟수가 제한 미만이면 재생성할 수 있어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      })

      const result = await checkRegenerationLimit('user-id', 'tags')

      expect(result.canRegenerate).toBe(true)
      expect(result.currentCount).toBe(5)
      expect(result.limit).toBe(10)
    })
  })

  describe('recordRegeneration', () => {
    it('재생성 기록을 성공적으로 저장해야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      })

      const result = await recordRegeneration('user-id', 'note-id', 'summary')

      expect(result.success).toBe(true)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('인증되지 않은 사용자는 기록을 저장할 수 없어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      })

      const result = await recordRegeneration('user-id', 'note-id', 'summary')

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })
  })

  describe('canRegenerateAndRecord', () => {
    it('재생성 가능하고 기록 저장이 성공하면 재생성할 수 있어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      // 재생성 횟수 확인 모킹
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      })

      // 기록 저장 모킹
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      })

      const result = await canRegenerateAndRecord('note-id', 'summary')

      expect(result.canRegenerate).toBe(true)
      expect(result.currentCount).toBe(6) // 5 + 1
      expect(result.limit).toBe(10)
    })

    it('재생성 횟수 제한을 초과하면 재생성할 수 없어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      })

      const result = await canRegenerateAndRecord('note-id', 'tags')

      expect(result.canRegenerate).toBe(false)
      expect(result.error).toContain('일일 태그 재생성 한도')
    })
  })

  describe('getRegenerationHistory', () => {
    it('사용자의 재생성 히스토리를 조회할 수 있어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      const mockHistory = [
        {
          id: 'reg-1',
          noteId: 'note-1',
          type: 'summary',
          createdAt: new Date('2024-12-19T10:00:00Z'),
        },
        {
          id: 'reg-2',
          noteId: 'note-2',
          type: 'tags',
          createdAt: new Date('2024-12-19T11:00:00Z'),
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockHistory),
          }),
        }),
      })

      const result = await getRegenerationHistory()

      expect(result.success).toBe(true)
      expect(result.history).toHaveLength(2)
      expect(result.history![0].type).toBe('summary')
      expect(result.history![1].type).toBe('tags')
    })

    it('특정 타입의 재생성 히스토리만 조회할 수 있어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: { id: 'user-id' } }, error: null }),
        },
      })

      const mockHistory = [
        {
          id: 'reg-1',
          noteId: 'note-1',
          type: 'summary',
          createdAt: new Date('2024-12-19T10:00:00Z'),
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockHistory),
          }),
        }),
      })

      const result = await getRegenerationHistory('summary')

      expect(result.success).toBe(true)
      expect(result.history).toHaveLength(1)
      expect(result.history![0].type).toBe('summary')
    })

    it('인증되지 않은 사용자는 히스토리를 조회할 수 없어야 한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: () => ({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      })

      const result = await getRegenerationHistory()

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })
  })
})
