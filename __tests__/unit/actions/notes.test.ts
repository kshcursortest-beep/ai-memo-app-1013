// __tests__/unit/actions/notes.test.ts
// 노트 Server Action 단위 테스트
// createNote, getNotes, getNoteById, updateNote, deleteNote 함수의 다양한 시나리오 검증
// 관련 파일: app/actions/notes.ts

import { createNote, getNotes, getNoteById, updateNote, deleteNote } from '@/app/actions/notes'
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

  describe('정렬 기능', () => {
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

    it('최신순 정렬 (latest)로 노트를 조회한다', async () => {
      // Given: 노트 목록
      const mockNotes = [
        { id: '3', title: 'Note 3', content: 'Content 3', createdAt: new Date('2025-10-14'), updatedAt: new Date('2025-10-14') },
        { id: '2', title: 'Note 2', content: 'Content 2', createdAt: new Date('2025-10-13'), updatedAt: new Date('2025-10-13') },
        { id: '1', title: 'Note 1', content: 'Content 1', createdAt: new Date('2025-10-12'), updatedAt: new Date('2025-10-12') },
      ]

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

      // When: 최신순 정렬로 조회
      const result = await getNotes(1, 10, 'latest')

      // Then: 최신순으로 정렬된 노트 반환
      expect(result.success).toBe(true)
      expect(result.data?.notes[0].id).toBe('3')
      expect(result.data?.notes[1].id).toBe('2')
      expect(result.data?.notes[2].id).toBe('1')
    })

    it('오래된순 정렬 (oldest)로 노트를 조회한다', async () => {
      // Given: 노트 목록
      const mockNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1', createdAt: new Date('2025-10-12'), updatedAt: new Date('2025-10-12') },
        { id: '2', title: 'Note 2', content: 'Content 2', createdAt: new Date('2025-10-13'), updatedAt: new Date('2025-10-13') },
        { id: '3', title: 'Note 3', content: 'Content 3', createdAt: new Date('2025-10-14'), updatedAt: new Date('2025-10-14') },
      ]

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

      // When: 오래된순 정렬로 조회
      const result = await getNotes(1, 10, 'oldest')

      // Then: 오래된순으로 정렬된 노트 반환
      expect(result.success).toBe(true)
      expect(result.data?.notes[0].id).toBe('1')
      expect(result.data?.notes[1].id).toBe('2')
      expect(result.data?.notes[2].id).toBe('3')
    })

    it('제목순 정렬 (title)로 노트를 조회한다', async () => {
      // Given: 노트 목록 (가나다순)
      const mockNotes = [
        { id: '1', title: '가나다', content: 'Content 1', createdAt: new Date('2025-10-12'), updatedAt: new Date('2025-10-12') },
        { id: '2', title: '나다라', content: 'Content 2', createdAt: new Date('2025-10-13'), updatedAt: new Date('2025-10-13') },
        { id: '3', title: '다라마', content: 'Content 3', createdAt: new Date('2025-10-14'), updatedAt: new Date('2025-10-14') },
      ]

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

      // When: 제목순 정렬로 조회
      const result = await getNotes(1, 10, 'title')

      // Then: 제목순으로 정렬된 노트 반환
      expect(result.success).toBe(true)
      expect(result.data?.notes[0].title).toBe('가나다')
      expect(result.data?.notes[1].title).toBe('나다라')
      expect(result.data?.notes[2].title).toBe('다라마')
    })

    it('잘못된 정렬 옵션은 기본값(latest)으로 처리한다', async () => {
      // Given: 노트 목록
      const mockNotes = [
        { id: '3', title: 'Note 3', content: 'Content 3', createdAt: new Date('2025-10-14'), updatedAt: new Date('2025-10-14') },
        { id: '2', title: 'Note 2', content: 'Content 2', createdAt: new Date('2025-10-13'), updatedAt: new Date('2025-10-13') },
      ]

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

      // When: 잘못된 정렬 옵션으로 조회 (타입 강제)
      const result = await getNotes(1, 10, 'invalid' as any)

      // Then: 기본값(latest)으로 정렬된 노트 반환
      expect(result.success).toBe(true)
      expect(result.data?.notes.length).toBe(2)
    })
  })
})

describe('getNoteById Server Action', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockNote = {
    id: 'note-123',
    title: 'Test Note',
    content: 'Test Content',
    createdAt: new Date('2025-10-14T10:00:00Z'),
    updatedAt: new Date('2025-10-14T10:00:00Z'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('인증 검증', () => {
    it('미인증 사용자는 노트를 조회할 수 없다', async () => {
      // Given: 인증되지 않은 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      })

      // When: 노트 조회 시도
      const result = await getNoteById('note-123')

      // Then: 인증 에러 반환
      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
      expect(result.data).toBeUndefined()
    })
  })

  describe('노트 조회', () => {
    beforeEach(() => {
      // 인증된 사용자로 설정
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('정상적으로 노트를 조회한다', async () => {
      // Given: DB에 노트 존재
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      })

      // When: 노트 조회
      const result = await getNoteById('note-123')

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNote)
      expect(result.error).toBeUndefined()
    })

    it('존재하지 않는 노트 ID로 조회 시 에러를 반환한다', async () => {
      // Given: DB에 노트 없음
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      // When: 존재하지 않는 노트 조회
      const result = await getNoteById('non-existent-id')

      // Then: Not Found 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
      expect(result.data).toBeUndefined()
    })

    it('다른 사용자의 노트는 조회할 수 없다 (사용자 스코프 검증)', async () => {
      // Given: 다른 사용자의 노트 (WHERE 조건으로 필터링됨)
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // 권한 없어서 빈 배열
          }),
        }),
      })

      // When: 다른 사용자의 노트 조회 시도
      const result = await getNoteById('other-user-note-id')

      // Then: Not Found 에러 (보안상 403이 아닌 404로 처리)
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('유효하지 않은 노트 ID로 조회 시 에러를 반환한다', async () => {
      // When: 빈 ID로 조회
      const result1 = await getNoteById('')

      // Then: 유효성 검사 에러
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('유효하지 않은 노트 ID입니다.')

      // When: null ID로 조회 (타입 강제)
      const result2 = await getNoteById(null as any)

      // Then: 유효성 검사 에러
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('유효하지 않은 노트 ID입니다.')
    })

    it('DB 에러 발생 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 에러 발생
      ;(db.select as jest.Mock) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB Error')),
          }),
        }),
      })

      // When: 노트 조회 시도
      const result = await getNoteById('note-123')

      // Then: 에러 응답
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 불러올 수 없습니다. 다시 시도해주세요.')
    })
  })
})

describe('updateNote Server Action', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockNote = {
    id: 'note-123',
    title: 'Updated Title',
    content: 'Updated Content',
    createdAt: new Date('2025-10-14T10:00:00Z'),
    updatedAt: new Date('2025-10-14T12:00:00Z'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('인증 검증', () => {
    it('미인증 사용자는 노트를 수정할 수 없다', async () => {
      // Given: 인증되지 않은 사용자
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      })

      // When: 노트 수정 시도
      const result = await updateNote('note-123', 'New Title', 'New Content')

      // Then: 인증 에러 반환
      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
      expect(result.data).toBeUndefined()
    })
  })

  describe('유효성 검사', () => {
    beforeEach(() => {
      // 인증된 사용자로 설정
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
      // When: 빈 제목으로 수정 시도
      const result = await updateNote('note-123', '', 'Content')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목을 입력해주세요.')
    })

    it('제목이 공백만 있으면 에러를 반환한다', async () => {
      // When: 공백만 있는 제목으로 수정 시도
      const result = await updateNote('note-123', '   ', 'Content')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목을 입력해주세요.')
    })

    it('제목이 500자를 초과하면 에러를 반환한다', async () => {
      // Given: 500자 초과 제목
      const longTitle = 'A'.repeat(501)

      // When: 긴 제목으로 수정 시도
      const result = await updateNote('note-123', longTitle, 'Content')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목은 최대 500자까지 입력 가능합니다.')
    })

    it('본문이 비어있으면 에러를 반환한다', async () => {
      // When: 빈 본문으로 수정 시도
      const result = await updateNote('note-123', 'Title', '')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('본문을 입력해주세요.')
    })

    it('본문이 공백만 있으면 에러를 반환한다', async () => {
      // When: 공백만 있는 본문으로 수정 시도
      const result = await updateNote('note-123', 'Title', '   ')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('본문을 입력해주세요.')
    })
  })

  describe('노트 수정', () => {
    beforeEach(() => {
      // 인증된 사용자로 설정
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('정상적으로 노트를 수정한다', async () => {
      // Given: DB 업데이트 성공
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockNote]),
          }),
        }),
      })

      // When: 노트 수정
      const result = await updateNote('note-123', 'Updated Title', 'Updated Content')

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNote)
      expect(result.error).toBeUndefined()
    })

    it('updated_at이 자동으로 갱신된다', async () => {
      // Given: DB 업데이트 성공
      const originalTime = new Date('2025-10-14T10:00:00Z')
      const updatedTime = new Date('2025-10-14T12:00:00Z')
      
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                ...mockNote,
                createdAt: originalTime,
                updatedAt: updatedTime,
              },
            ]),
          }),
        }),
      })

      // When: 노트 수정
      const result = await updateNote('note-123', 'Title', 'Content')

      // Then: updated_at이 갱신됨
      expect(result.success).toBe(true)
      expect(result.data?.updatedAt.getTime()).toBeGreaterThan(result.data!.createdAt.getTime())
    })

    it('제목과 본문의 앞뒤 공백을 제거한다', async () => {
      // Given: DB 업데이트 성공
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                ...mockNote,
                title: 'Trimmed Title',
                content: 'Trimmed Content',
              },
            ]),
          }),
        }),
      })

      // When: 공백이 포함된 입력으로 수정
      const result = await updateNote('note-123', '  Trimmed Title  ', '  Trimmed Content  ')

      // Then: 공백이 제거됨
      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Trimmed Title')
      expect(result.data?.content).toBe('Trimmed Content')
    })

    it('존재하지 않는 노트 ID로 수정 시 에러를 반환한다', async () => {
      // Given: DB에 노트 없음
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      // When: 존재하지 않는 노트 수정 시도
      const result = await updateNote('non-existent-id', 'Title', 'Content')

      // Then: Not Found 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
      expect(result.data).toBeUndefined()
    })

    it('다른 사용자의 노트는 수정할 수 없다 (사용자 스코프 검증)', async () => {
      // Given: 다른 사용자의 노트 (WHERE 조건으로 필터링됨)
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]), // 권한 없어서 빈 배열
          }),
        }),
      })

      // When: 다른 사용자의 노트 수정 시도
      const result = await updateNote('other-user-note-id', 'Title', 'Content')

      // Then: Not Found 에러 (보안상 403이 아닌 404로 처리)
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('유효하지 않은 노트 ID로 수정 시 에러를 반환한다', async () => {
      // When: 빈 ID로 수정
      const result1 = await updateNote('', 'Title', 'Content')

      // Then: 유효성 검사 에러
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('유효하지 않은 노트 ID입니다.')

      // When: null ID로 수정 (타입 강제)
      const result2 = await updateNote(null as any, 'Title', 'Content')

      // Then: 유효성 검사 에러
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('유효하지 않은 노트 ID입니다.')
    })

    it('DB 에러 발생 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 에러 발생
      ;(db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('DB Error')),
          }),
        }),
      })

      // When: 노트 수정 시도
      const result = await updateNote('note-123', 'Title', 'Content')

      // Then: 에러 응답
      expect(result.success).toBe(false)
      expect(result.error).toBe('저장에 실패했습니다. 다시 시도해주세요.')
    })
  })
})

describe('deleteNote Server Action', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('인증 검증', () => {
    it('미인증 사용자는 노트를 삭제할 수 없다', async () => {
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

      // Then: 인증 에러 반환
      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
    })
  })

  describe('유효성 검사', () => {
    beforeEach(() => {
      // 인증된 사용자로 설정
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('빈 노트 ID로 삭제 시 에러를 반환한다', async () => {
      // When: 빈 ID로 삭제 시도
      const result = await deleteNote('')

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('유효하지 않은 노트 ID입니다.')
    })

    it('null 노트 ID로 삭제 시 에러를 반환한다', async () => {
      // When: null ID로 삭제 시도 (타입 강제)
      const result = await deleteNote(null as any)

      // Then: 유효성 검사 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('유효하지 않은 노트 ID입니다.')
    })
  })

  describe('노트 삭제', () => {
    beforeEach(() => {
      // 인증된 사용자로 설정
      ;(createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      })
    })

    it('정상적으로 노트를 삭제한다', async () => {
      // Given: DB 삭제 성공
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'note-123' }]),
        }),
      })

      // When: 노트 삭제
      const result = await deleteNote('note-123')

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('존재하지 않는 노트 ID로 삭제 시 에러를 반환한다', async () => {
      // Given: DB에 노트 없음
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]), // 빈 배열
        }),
      })

      // When: 존재하지 않는 노트 삭제 시도
      const result = await deleteNote('non-existent-id')

      // Then: Not Found 에러
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('다른 사용자의 노트는 삭제할 수 없다 (사용자 스코프 검증)', async () => {
      // Given: 다른 사용자의 노트 (WHERE 조건으로 필터링됨)
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]), // 권한 없어서 빈 배열
        }),
      })

      // When: 다른 사용자의 노트 삭제 시도
      const result = await deleteNote('other-user-note-id')

      // Then: Not Found 에러 (보안상 403이 아닌 404로 처리)
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('DB 에러 발생 시 적절한 에러 메시지를 반환한다', async () => {
      // Given: DB 에러 발생
      ;(db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      })

      // When: 노트 삭제 시도
      const result = await deleteNote('note-123')

      // Then: 에러 응답
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 삭제에 실패했습니다. 다시 시도해주세요.')
    })
  })
})

