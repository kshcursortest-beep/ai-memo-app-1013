// __tests__/unit/actions/notes.test.ts
// 노트 Server Action 단위 테스트
// createNote 함수의 다양한 시나리오 검증
// 관련 파일: app/actions/notes.ts

import { createNote } from '@/app/actions/notes'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

// Mock 설정
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db')

describe('createNote Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('인증 검증', () => {
    it('미인증 사용자는 노트를 생성할 수 없다', async () => {
      // Given: 인증되지 않은 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      })

      // When: 노트 생성 시도
      const result = await createNote('Test Title', 'Test Content')

      // Then: 인증 에러 반환
      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
      expect(result.noteId).toBeUndefined()
    })

    it('인증된 사용자는 노트를 생성할 수 있다', async () => {
      // Given: 인증된 사용자
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            { id: 'note-123', userId: 'user-123', title: 'Test Title', content: 'Test Content' },
          ]),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      // When: 노트 생성
      const result = await createNote('Test Title', 'Test Content')

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.noteId).toBe('note-123')
      expect(result.error).toBeUndefined()
    })
  })

  describe('유효성 검사', () => {
    beforeEach(() => {
      // 모든 테스트에서 인증된 사용자로 설정
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('제목이 비어있으면 에러를 반환한다', async () => {
      // When: 빈 제목으로 노트 생성 시도
      const result = await createNote('', 'Test Content')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목을 입력해주세요.')
    })

    it('제목이 공백만 있으면 에러를 반환한다', async () => {
      // When: 공백만 있는 제목으로 노트 생성 시도
      const result = await createNote('   ', 'Test Content')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목을 입력해주세요.')
    })

    it('제목이 500자를 초과하면 에러를 반환한다', async () => {
      // Given: 500자를 초과하는 제목
      const longTitle = 'a'.repeat(501)

      // When: 노트 생성 시도
      const result = await createNote(longTitle, 'Test Content')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목은 최대 500자까지 입력 가능합니다.')
    })

    it('본문이 비어있으면 에러를 반환한다', async () => {
      // When: 빈 본문으로 노트 생성 시도
      const result = await createNote('Test Title', '')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('본문을 입력해주세요.')
    })

    it('본문이 공백만 있으면 에러를 반환한다', async () => {
      // When: 공백만 있는 본문으로 노트 생성 시도
      const result = await createNote('Test Title', '   ')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('본문을 입력해주세요.')
    })
  })

  describe('노트 생성', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('유효한 입력으로 노트를 성공적으로 생성한다', async () => {
      // Given: 유효한 제목과 본문
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            { id: 'note-123', userId: 'user-123', title: 'Test Title', content: 'Test Content' },
          ]),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      // When: 노트 생성
      const result = await createNote('Test Title', 'Test Content')

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.noteId).toBe('note-123')
    })

    it('제목과 본문의 앞뒤 공백을 제거한다', async () => {
      // Given: 앞뒤 공백이 있는 입력
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            { id: 'note-123', userId: 'user-123', title: 'Test Title', content: 'Test Content' },
          ]),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      // When: 노트 생성
      await createNote('  Test Title  ', '  Test Content  ')

      // Then: trim된 값으로 DB에 저장
      expect(mockInsert().values).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Title',
        content: 'Test Content',
      })
    })

    it('DB 에러 발생 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 에러 발생
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      })
      ;(db.insert as jest.Mock) = mockInsert

      // When: 노트 생성 시도
      const result = await createNote('Test Title', 'Test Content')

      // Then: 에러 응답
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 저장에 실패했습니다. 다시 시도해주세요.')
    })
  })
})

