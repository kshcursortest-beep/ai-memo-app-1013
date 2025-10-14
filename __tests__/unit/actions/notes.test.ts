// __tests__/unit/actions/notes.test.ts
// 노트 Server Action 단위 테스트
// createNote, getNotes 함수의 다양한 시나리오 검증
// 관련 파일: app/actions/notes.ts

import { createNote, getNotes } from '@/app/actions/notes'
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

describe('getNotes Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('인증 검증', () => {
    it('미인증 사용자는 노트 목록을 조회할 수 없다', async () => {
      // Given: 인증되지 않은 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      })

      // When: 노트 목록 조회 시도
      const result = await getNotes()

      // Then: 인증 에러 반환
      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
      expect(result.data).toBeUndefined()
    })
  })

  describe('노트 목록 조회', () => {
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

    it('정상적으로 노트 목록을 조회한다', async () => {
      // Given: 사용자의 노트 3개
      const mockNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Note 2', content: 'Content 2', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', title: 'Note 3', content: 'Content 3', createdAt: new Date(), updatedAt: new Date() },
      ]

      const mockSelect = jest.fn().mockReturnValue({
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

      const mockCount = jest.fn().mockResolvedValue([{ count: 3 }])
      ;(db.select as jest.Mock) = mockSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 3 }]),
        }),
      })

      ;(db.select as jest.Mock) = jest.fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 3 }]),
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
      expect(result.data?.notes).toEqual(mockNotes)
      expect(result.data?.total).toBe(3)
      expect(result.data?.page).toBe(1)
      expect(result.data?.pageSize).toBe(10)
      expect(result.data?.totalPages).toBe(1)
    })

    it('빈 목록을 올바르게 처리한다', async () => {
      // Given: 노트가 없는 사용자
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

    it('페이지 번호가 0 이하면 1로 보정한다', async () => {
      // Given: DB mock 설정
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

      // When: 페이지 번호 0으로 조회
      const result = await getNotes(0, 10)

      // Then: 페이지 1로 조회
      expect(result.data?.page).toBe(1)
    })

    it('페이지 크기를 최소 1, 최대 100으로 제한한다', async () => {
      // Given: DB mock 설정
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

      // When: 페이지 크기 200으로 조회
      const result = await getNotes(1, 200)

      // Then: 페이지 크기 100으로 제한
      expect(result.data?.pageSize).toBe(100)
    })

    it('DB 에러 발생 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 에러 발생
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      })

      // When: 노트 목록 조회 시도
      const result = await getNotes()

      // Then: 에러 응답
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 목록을 불러올 수 없습니다. 다시 시도해주세요.')
    })
  })
})

