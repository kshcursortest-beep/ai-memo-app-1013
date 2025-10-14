// drizzle/schema.ts
// Drizzle ORM 데이터베이스 스키마 정의
// 테이블: user_profiles, notes, note_tags, summaries
// 관련 파일: lib/db.ts, app/actions/onboarding.ts, app/actions/notes.ts

import { pgTable, uuid, boolean, timestamp, varchar, text, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * 사용자 프로필 테이블
 * Supabase Auth users와 1:1 관계
 */
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  hasCompletedOnboarding: boolean('has_completed_onboarding').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
})

/**
 * 노트 테이블
 * 사용자가 작성한 메모를 저장
 * 권한 스코프: user_id로 소유자만 CRUD 가능
 */
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // Supabase Auth user ID
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  // 사용자별 노트 조회 성능 최적화
  userIdIdx: index('notes_user_id_idx').on(table.userId),
  // 최신순 정렬 성능 최적화
  createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
}))

/**
 * 노트 태그 테이블
 * AI 자동 태깅 또는 사용자 수동 태깅 결과 저장
 * 외래 키: CASCADE DELETE (노트 삭제 시 태그도 함께 삭제)
 */
export const noteTags = pgTable('note_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // 태그 검색 최적화 및 중복 방지
  noteIdTagIdx: index('note_tags_note_id_tag_idx').on(table.noteId, table.tag),
}))

/**
 * AI 요약 테이블
 * 노트에 대한 AI 생성 요약 저장 (노트당 1개의 요약만 허용)
 * 외래 키: CASCADE DELETE (노트 삭제 시 요약도 함께 삭제)
 */
export const summaries = pgTable('summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }).unique(),
  model: varchar('model', { length: 100 }).notNull(), // 예: "gemini-1.5-flash"
  content: text('content').notNull(), // 요약 내용 (3-6 불릿 포인트)
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 노트 관계 정의
 * - notes → noteTags (one-to-many)
 * - notes → summaries (one-to-one)
 */
export const notesRelations = relations(notes, ({ many, one }) => ({
  tags: many(noteTags),
  summary: one(summaries, {
    fields: [notes.id],
    references: [summaries.noteId],
  }),
}))

/**
 * 태그 관계 정의
 * - noteTags → notes (many-to-one)
 */
export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
}))

/**
 * 요약 관계 정의
 * - summaries → notes (one-to-one)
 */
export const summariesRelations = relations(summaries, ({ one }) => ({
  note: one(notes, {
    fields: [summaries.noteId],
    references: [notes.id],
  }),
}))

