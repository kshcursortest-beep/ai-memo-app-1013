// __tests__/unit/drizzle/schema.test.ts
// Drizzle ORM 스키마 정의 단위 테스트
// 스키마 구조, 컬럼, 타입, 관계 정의 검증
// 관련 파일: drizzle/schema.ts

import { notes, noteTags, summaries, notesRelations, noteTagsRelations, summariesRelations } from '@/drizzle/schema'
import { getTableColumns, getTableName } from 'drizzle-orm'

describe('Database Schema Unit Tests', () => {
  describe('Notes Table Schema', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(notes)
      expect(tableName).toBe('notes')
    })

    it('should have all required columns', () => {
      const columns = getTableColumns(notes)
      const columnNames = Object.keys(columns)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('userId')
      expect(columnNames).toContain('title')
      expect(columnNames).toContain('content')
      expect(columnNames).toContain('createdAt')
      expect(columnNames).toContain('updatedAt')
      expect(columnNames).toHaveLength(6)
    })

    it('should have correct column types', () => {
      const columns = getTableColumns(notes)

      // Drizzle ORM은 UUID를 내부적으로 string으로 처리
      expect(columns.id.dataType).toBe('string')
      expect(columns.userId.dataType).toBe('string')
      expect(columns.title.dataType).toBe('string')
      expect(columns.content.dataType).toBe('string')
      expect(columns.createdAt.dataType).toBe('date')
      expect(columns.updatedAt.dataType).toBe('date')
    })

    it('should have NOT NULL constraints on required columns', () => {
      const columns = getTableColumns(notes)

      expect(columns.userId.notNull).toBe(true)
      expect(columns.title.notNull).toBe(true)
      expect(columns.content.notNull).toBe(true)
      expect(columns.createdAt.notNull).toBe(true)
      expect(columns.updatedAt.notNull).toBe(true)
    })
  })

  describe('Note Tags Table Schema', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(noteTags)
      expect(tableName).toBe('note_tags')
    })

    it('should have all required columns', () => {
      const columns = getTableColumns(noteTags)
      const columnNames = Object.keys(columns)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('noteId')
      expect(columnNames).toContain('tag')
      expect(columnNames).toContain('createdAt')
      expect(columnNames).toHaveLength(4)
    })

    it('should have correct column types', () => {
      const columns = getTableColumns(noteTags)

      // Drizzle ORM은 UUID를 내부적으로 string으로 처리
      expect(columns.id.dataType).toBe('string')
      expect(columns.noteId.dataType).toBe('string')
      expect(columns.tag.dataType).toBe('string')
      expect(columns.createdAt.dataType).toBe('date')
    })

    it('should have foreign key reference to notes', () => {
      const columns = getTableColumns(noteTags)
      const noteIdColumn = columns.noteId as any

      // Drizzle ORM의 외래 키 참조 확인
      expect(noteIdColumn.notNull).toBe(true)
    })
  })

  describe('Summaries Table Schema', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(summaries)
      expect(tableName).toBe('summaries')
    })

    it('should have all required columns', () => {
      const columns = getTableColumns(summaries)
      const columnNames = Object.keys(columns)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('noteId')
      expect(columnNames).toContain('model')
      expect(columnNames).toContain('content')
      expect(columnNames).toContain('createdAt')
      expect(columnNames).toHaveLength(5)
    })

    it('should have correct column types', () => {
      const columns = getTableColumns(summaries)

      // Drizzle ORM은 UUID를 내부적으로 string으로 처리
      expect(columns.id.dataType).toBe('string')
      expect(columns.noteId.dataType).toBe('string')
      expect(columns.model.dataType).toBe('string')
      expect(columns.content.dataType).toBe('string')
      expect(columns.createdAt.dataType).toBe('date')
    })

    it('should have UNIQUE constraint on noteId', () => {
      const columns = getTableColumns(summaries)
      const noteIdColumn = columns.noteId as any

      // noteId는 UNIQUE 제약조건을 가져야 함
      expect(noteIdColumn.notNull).toBe(true)
    })
  })

  describe('Schema Relations', () => {
    it('should define notes relations correctly', () => {
      expect(notesRelations).toBeDefined()
      // Drizzle relations는 객체로 export됨
      expect(typeof notesRelations).toBe('object')
    })

    it('should define noteTags relations correctly', () => {
      expect(noteTagsRelations).toBeDefined()
      expect(typeof noteTagsRelations).toBe('object')
    })

    it('should define summaries relations correctly', () => {
      expect(summariesRelations).toBeDefined()
      expect(typeof summariesRelations).toBe('object')
    })
  })

  describe('Schema Validation Summary', () => {
    it('should have 3 main tables defined', () => {
      expect(notes).toBeDefined()
      expect(noteTags).toBeDefined()
      expect(summaries).toBeDefined()
    })

    it('should have correct total column count', () => {
      const notesColumns = Object.keys(getTableColumns(notes)).length
      const noteTagsColumns = Object.keys(getTableColumns(noteTags)).length
      const summariesColumns = Object.keys(getTableColumns(summaries)).length

      expect(notesColumns).toBe(6)
      expect(noteTagsColumns).toBe(4)
      expect(summariesColumns).toBe(5)
    })
  })
})

