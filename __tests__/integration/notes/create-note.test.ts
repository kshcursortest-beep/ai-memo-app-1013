// __tests__/integration/notes/create-note.test.ts
// 노트 생성 통합 테스트
// End-to-end 노트 생성 플로우 및 DB 저장 검증
// 관련 파일: app/actions/notes.ts, drizzle/schema.ts

import { createNote } from '@/app/actions/notes'
import { db } from '@/lib/db'
import { notes } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

// Mock 사용자 ID
const TEST_USER_ID_1 = '00000000-0000-0000-0000-000000000001'
const TEST_USER_ID_2 = '00000000-0000-0000-0000-000000000002'

// Supabase Auth Mock
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: {
          user: {
            id: TEST_USER_ID_1,
            email: 'test@example.com',
          },
        },
        error: null,
      })),
    },
  })),
}))

describe('노트 생성 통합 테스트', () => {
  // 각 테스트 후 데이터 정리
  afterEach(async () => {
    await db.delete(notes).execute()
  })

  describe('노트 생성 플로우', () => {
    it('정상적인 노트 생성이 DB에 저장된다', async () => {
      // When: 노트 생성
      const result = await createNote('통합 테스트 노트', '통합 테스트 본문')

      // Then: 성공 응답
      expect(result.success).toBe(true)
      expect(result.noteId).toBeDefined()

      // DB에 실제로 저장되었는지 확인
      const savedNotes = await db.select().from(notes).where(eq(notes.id, result.noteId!))
      expect(savedNotes).toHaveLength(1)
      expect(savedNotes[0].title).toBe('통합 테스트 노트')
      expect(savedNotes[0].content).toBe('통합 테스트 본문')
      expect(savedNotes[0].userId).toBe(TEST_USER_ID_1)
    })

    it('생성된 노트에 타임스탬프가 자동으로 설정된다', async () => {
      // When: 노트 생성
      const result = await createNote('타임스탬프 테스트', '타임스탬프 테스트 본문')

      // Then: created_at과 updated_at이 설정됨
      const savedNotes = await db.select().from(notes).where(eq(notes.id, result.noteId!))
      expect(savedNotes[0].createdAt).toBeInstanceOf(Date)
      expect(savedNotes[0].updatedAt).toBeInstanceOf(Date)
    })

    it('동일한 사용자가 여러 노트를 생성할 수 있다', async () => {
      // When: 여러 노트 생성
      const result1 = await createNote('노트 1', '본문 1')
      const result2 = await createNote('노트 2', '본문 2')
      const result3 = await createNote('노트 3', '본문 3')

      // Then: 모두 성공
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)

      // DB에 3개 저장됨
      const savedNotes = await db.select().from(notes).where(eq(notes.userId, TEST_USER_ID_1))
      expect(savedNotes).toHaveLength(3)
    })
  })

  describe('사용자 스코프 검증', () => {
    it('생성된 노트는 현재 사용자의 user_id와 연결된다', async () => {
      // When: 노트 생성
      const result = await createNote('사용자 스코프 테스트', '테스트 본문')

      // Then: user_id가 현재 사용자와 일치
      const savedNotes = await db.select().from(notes).where(eq(notes.id, result.noteId!))
      expect(savedNotes[0].userId).toBe(TEST_USER_ID_1)
    })

    it('다른 사용자의 노트와 격리된다', async () => {
      // Given: 사용자 1의 노트 생성
      const result1 = await createNote('사용자 1의 노트', '본문 1')

      // When: DB에서 사용자 2의 노트 조회
      const user2Notes = await db.select().from(notes).where(eq(notes.userId, TEST_USER_ID_2))

      // Then: 사용자 2의 노트는 없음
      expect(user2Notes).toHaveLength(0)

      // 사용자 1의 노트만 존재
      const user1Notes = await db.select().from(notes).where(eq(notes.userId, TEST_USER_ID_1))
      expect(user1Notes).toHaveLength(1)
      expect(user1Notes[0].id).toBe(result1.noteId)
    })
  })

  describe('에러 처리', () => {
    it('유효성 검사 실패 시 DB에 저장되지 않는다', async () => {
      // When: 잘못된 입력으로 노트 생성 시도
      const result = await createNote('', '본문')

      // Then: 실패 응답
      expect(result.success).toBe(false)
      expect(result.error).toBe('제목을 입력해주세요.')

      // DB에 저장되지 않음
      const savedNotes = await db.select().from(notes)
      expect(savedNotes).toHaveLength(0)
    })

    it('여러 번 실패해도 데이터가 쌓이지 않는다', async () => {
      // When: 여러 번 실패
      await createNote('', '본문 1')
      await createNote('제목', '')
      await createNote('', '')

      // Then: DB에 아무것도 저장되지 않음
      const savedNotes = await db.select().from(notes)
      expect(savedNotes).toHaveLength(0)
    })
  })

  describe('입력값 처리', () => {
    it('제목과 본문의 앞뒤 공백이 제거되어 저장된다', async () => {
      // When: 공백이 포함된 입력으로 노트 생성
      const result = await createNote('  트림 테스트  ', '  트림된 본문  ')

      // Then: 공백이 제거되어 저장됨
      const savedNotes = await db.select().from(notes).where(eq(notes.id, result.noteId!))
      expect(savedNotes[0].title).toBe('트림 테스트')
      expect(savedNotes[0].content).toBe('트림된 본문')
    })

    it('긴 제목도 정상적으로 저장된다', async () => {
      // Given: 500자 제목
      const longTitle = 'A'.repeat(500)

      // When: 노트 생성
      const result = await createNote(longTitle, '본문')

      // Then: 정상 저장
      expect(result.success).toBe(true)
      const savedNotes = await db.select().from(notes).where(eq(notes.id, result.noteId!))
      expect(savedNotes[0].title).toHaveLength(500)
    })

    it('긴 본문도 정상적으로 저장된다', async () => {
      // Given: 매우 긴 본문
      const longContent = 'B'.repeat(10000)

      // When: 노트 생성
      const result = await createNote('제목', longContent)

      // Then: 정상 저장
      expect(result.success).toBe(true)
      const savedNotes = await db.select().from(notes).where(eq(notes.id, result.noteId!))
      expect(savedNotes[0].content).toHaveLength(10000)
    })
  })

  describe('동시성 테스트', () => {
    it('동시에 여러 노트를 생성해도 모두 저장된다', async () => {
      // When: 동시에 여러 노트 생성
      const promises = [
        createNote('동시 노트 1', '본문 1'),
        createNote('동시 노트 2', '본문 2'),
        createNote('동시 노트 3', '본문 3'),
        createNote('동시 노트 4', '본문 4'),
        createNote('동시 노트 5', '본문 5'),
      ]

      const results = await Promise.all(promises)

      // Then: 모두 성공
      expect(results.every(r => r.success)).toBe(true)

      // DB에 5개 저장됨
      const savedNotes = await db.select().from(notes)
      expect(savedNotes).toHaveLength(5)
    })
  })
})

