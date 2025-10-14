// __tests__/integration/db/notes-schema.test.ts
// 노트 관리 데이터베이스 스키마 통합 테스트
// 실제 DB와 상호작용하여 CRUD, 외래 키, CASCADE DELETE 검증
// 관련 파일: drizzle/schema.ts, lib/db.ts

import { db } from '@/lib/db'
import { notes, noteTags, summaries } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'

// 테스트용 사용자 ID
const TEST_USER_ID_1 = '00000000-0000-0000-0000-000000000001'
const TEST_USER_ID_2 = '00000000-0000-0000-0000-000000000002'

describe('Notes Schema Integration Tests', () => {
  // 각 테스트 후 데이터 정리
  afterEach(async () => {
    await db.delete(noteTags).execute()
    await db.delete(summaries).execute()
    await db.delete(notes).execute()
  })

  describe('Notes CRUD Operations', () => {
    it('should create a note successfully', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Test Note',
        content: 'This is a test note content.',
      }).returning()

      expect(note).toBeDefined()
      expect(note.id).toBeDefined()
      expect(note.userId).toBe(TEST_USER_ID_1)
      expect(note.title).toBe('Test Note')
      expect(note.content).toBe('This is a test note content.')
      expect(note.createdAt).toBeInstanceOf(Date)
      expect(note.updatedAt).toBeInstanceOf(Date)
    })

    it('should retrieve notes by user ID', async () => {
      // 사용자 1의 노트 생성
      await db.insert(notes).values([
        { userId: TEST_USER_ID_1, title: 'Note 1', content: 'Content 1' },
        { userId: TEST_USER_ID_1, title: 'Note 2', content: 'Content 2' },
      ])

      // 사용자 2의 노트 생성
      await db.insert(notes).values([
        { userId: TEST_USER_ID_2, title: 'Note 3', content: 'Content 3' },
      ])

      // 사용자 1의 노트만 조회
      const user1Notes = await db.select().from(notes).where(eq(notes.userId, TEST_USER_ID_1))

      expect(user1Notes).toHaveLength(2)
      expect(user1Notes.every(note => note.userId === TEST_USER_ID_1)).toBe(true)
    })

    it('should update a note successfully', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Original Title',
        content: 'Original Content',
      }).returning()

      const [updatedNote] = await db.update(notes)
        .set({
          title: 'Updated Title',
          content: 'Updated Content',
          updatedAt: new Date(),
        })
        .where(eq(notes.id, note.id))
        .returning()

      expect(updatedNote.title).toBe('Updated Title')
      expect(updatedNote.content).toBe('Updated Content')
      expect(updatedNote.updatedAt.getTime()).toBeGreaterThan(note.updatedAt.getTime())
    })

    it('should delete a note successfully', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'To Delete',
        content: 'Will be deleted',
      }).returning()

      await db.delete(notes).where(eq(notes.id, note.id))

      const deletedNote = await db.select().from(notes).where(eq(notes.id, note.id))
      expect(deletedNote).toHaveLength(0)
    })
  })

  describe('Note Tags Operations', () => {
    it('should add tags to a note', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Tagged Note',
        content: 'Note with tags',
      }).returning()

      const tags = await db.insert(noteTags).values([
        { noteId: note.id, tag: 'important' },
        { noteId: note.id, tag: 'work' },
        { noteId: note.id, tag: 'urgent' },
      ]).returning()

      expect(tags).toHaveLength(3)
      expect(tags.every(t => t.noteId === note.id)).toBe(true)
    })

    it('should retrieve tags for a note', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Tagged Note',
        content: 'Note with tags',
      }).returning()

      await db.insert(noteTags).values([
        { noteId: note.id, tag: 'tag1' },
        { noteId: note.id, tag: 'tag2' },
      ])

      const tags = await db.select().from(noteTags).where(eq(noteTags.noteId, note.id))

      expect(tags).toHaveLength(2)
      expect(tags.map(t => t.tag)).toContain('tag1')
      expect(tags.map(t => t.tag)).toContain('tag2')
    })

    it('should delete tags when note is deleted (CASCADE DELETE)', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Note with Tags',
        content: 'Content',
      }).returning()

      await db.insert(noteTags).values([
        { noteId: note.id, tag: 'tag1' },
        { noteId: note.id, tag: 'tag2' },
      ])

      // 노트 삭제
      await db.delete(notes).where(eq(notes.id, note.id))

      // 태그도 함께 삭제되었는지 확인
      const remainingTags = await db.select().from(noteTags).where(eq(noteTags.noteId, note.id))
      expect(remainingTags).toHaveLength(0)
    })
  })

  describe('Summaries Operations', () => {
    it('should create a summary for a note', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Note for Summary',
        content: 'This is a long note that needs summarization...',
      }).returning()

      const [summary] = await db.insert(summaries).values({
        noteId: note.id,
        model: 'gemini-1.5-flash',
        content: '- Key point 1\n- Key point 2\n- Key point 3',
      }).returning()

      expect(summary).toBeDefined()
      expect(summary.noteId).toBe(note.id)
      expect(summary.model).toBe('gemini-1.5-flash')
      expect(summary.content).toContain('Key point')
    })

    it('should enforce UNIQUE constraint on noteId', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Note',
        content: 'Content',
      }).returning()

      await db.insert(summaries).values({
        noteId: note.id,
        model: 'gemini-1.5-flash',
        content: 'Summary 1',
      })

      // 같은 noteId로 두 번째 요약 생성 시도 (실패해야 함)
      await expect(
        db.insert(summaries).values({
          noteId: note.id,
          model: 'gemini-1.5-pro',
          content: 'Summary 2',
        })
      ).rejects.toThrow()
    })

    it('should delete summary when note is deleted (CASCADE DELETE)', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Note with Summary',
        content: 'Content',
      }).returning()

      await db.insert(summaries).values({
        noteId: note.id,
        model: 'gemini-1.5-flash',
        content: 'Summary',
      })

      // 노트 삭제
      await db.delete(notes).where(eq(notes.id, note.id))

      // 요약도 함께 삭제되었는지 확인
      const remainingSummaries = await db.select().from(summaries).where(eq(summaries.noteId, note.id))
      expect(remainingSummaries).toHaveLength(0)
    })
  })

  describe('User Data Isolation', () => {
    it('should isolate notes between different users', async () => {
      // 사용자 1의 노트
      const [note1] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'User 1 Note',
        content: 'User 1 Content',
      }).returning()

      // 사용자 2의 노트
      const [note2] = await db.insert(notes).values({
        userId: TEST_USER_ID_2,
        title: 'User 2 Note',
        content: 'User 2 Content',
      }).returning()

      // 사용자 1의 노트 조회
      const user1Notes = await db.select().from(notes).where(eq(notes.userId, TEST_USER_ID_1))
      expect(user1Notes).toHaveLength(1)
      expect(user1Notes[0].id).toBe(note1.id)

      // 사용자 2의 노트 조회
      const user2Notes = await db.select().from(notes).where(eq(notes.userId, TEST_USER_ID_2))
      expect(user2Notes).toHaveLength(1)
      expect(user2Notes[0].id).toBe(note2.id)
    })

    it('should prevent unauthorized note access', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Private Note',
        content: 'Private Content',
      }).returning()

      // 다른 사용자가 이 노트에 접근 시도
      const unauthorizedAccess = await db.select().from(notes).where(
        and(
          eq(notes.id, note.id),
          eq(notes.userId, TEST_USER_ID_2)
        )
      )

      expect(unauthorizedAccess).toHaveLength(0)
    })
  })

  describe('Complex Queries with Relations', () => {
    it('should query notes with tags using relations', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Note with Relations',
        content: 'Content',
      }).returning()

      await db.insert(noteTags).values([
        { noteId: note.id, tag: 'tag1' },
        { noteId: note.id, tag: 'tag2' },
      ])

      const noteWithTags = await db.query.notes.findFirst({
        where: eq(notes.id, note.id),
        with: {
          tags: true,
        },
      })

      expect(noteWithTags).toBeDefined()
      expect(noteWithTags?.tags).toHaveLength(2)
      expect(noteWithTags?.tags.map(t => t.tag)).toContain('tag1')
      expect(noteWithTags?.tags.map(t => t.tag)).toContain('tag2')
    })

    it('should query notes with summary using relations', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Note with Summary',
        content: 'Long content...',
      }).returning()

      await db.insert(summaries).values({
        noteId: note.id,
        model: 'gemini-1.5-flash',
        content: '- Summary point 1',
      })

      const noteWithSummary = await db.query.notes.findFirst({
        where: eq(notes.id, note.id),
        with: {
          summary: true,
        },
      })

      expect(noteWithSummary).toBeDefined()
      expect(noteWithSummary?.summary).toBeDefined()
      expect(noteWithSummary?.summary?.model).toBe('gemini-1.5-flash')
    })

    it('should query notes with both tags and summary', async () => {
      const [note] = await db.insert(notes).values({
        userId: TEST_USER_ID_1,
        title: 'Complete Note',
        content: 'Content',
      }).returning()

      await db.insert(noteTags).values([
        { noteId: note.id, tag: 'important' },
      ])

      await db.insert(summaries).values({
        noteId: note.id,
        model: 'gemini-1.5-flash',
        content: '- Summary',
      })

      const completeNote = await db.query.notes.findFirst({
        where: eq(notes.id, note.id),
        with: {
          tags: true,
          summary: true,
        },
      })

      expect(completeNote).toBeDefined()
      expect(completeNote?.tags).toHaveLength(1)
      expect(completeNote?.summary).toBeDefined()
    })
  })
})

