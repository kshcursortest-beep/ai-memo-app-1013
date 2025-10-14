// app/actions/notes.ts
// 노트 관련 Server Actions
// 노트 생성, 조회, 수정, 삭제 기능 제공
// 관련 파일: drizzle/schema.ts, lib/db.ts, lib/supabase/server.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes } from '@/drizzle/schema'
import { eq, desc, asc, count, and } from 'drizzle-orm'
import type { SortOption } from '@/lib/types/notes'
import { getSortOption } from '@/lib/types/notes'

/**
 * 새로운 노트 생성
 * @param title - 노트 제목 (최대 500자)
 * @param content - 노트 본문
 * @returns 성공 여부, 생성된 노트 ID 또는 에러 메시지
 */
export async function createNote(
  title: string,
  content: string
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. 입력값 유효성 검사
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      return {
        success: false,
        error: '제목을 입력해주세요.',
      }
    }

    if (trimmedTitle.length > 500) {
      return {
        success: false,
        error: '제목은 최대 500자까지 입력 가능합니다.',
      }
    }

    if (!trimmedContent) {
      return {
        success: false,
        error: '본문을 입력해주세요.',
      }
    }

    // 3. 노트 생성
    const [newNote] = await db.insert(notes).values({
      userId: user.id,
      title: trimmedTitle,
      content: trimmedContent,
    }).returning()

    return {
      success: true,
      noteId: newNote.id,
    }
  } catch (error) {
    console.error('노트 생성 실패:', error)
    return {
      success: false,
      error: '노트 저장에 실패했습니다. 다시 시도해주세요.',
    }
  }
}

/**
 * 노트 목록 조회 (페이지네이션 + 정렬)
 * @param page - 페이지 번호 (1부터 시작)
 * @param pageSize - 페이지당 노트 개수 (기본값: 10)
 * @param sortBy - 정렬 옵션 ('latest' | 'oldest' | 'title', 기본값: 'latest')
 * @returns 노트 목록, 전체 개수, 페이지 정보
 */
export async function getNotes(
  page: number = 1,
  pageSize: number = 10,
  sortBy: SortOption = 'latest'
): Promise<{
  success: boolean
  data?: {
    notes: Array<{
      id: string
      title: string
      content: string
      createdAt: Date
      updatedAt: Date
    }>
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. 페이지 번호 및 정렬 옵션 검증
    const currentPage = Math.max(1, page)
    const limit = Math.max(1, Math.min(100, pageSize)) // 최대 100개
    const validSortBy = getSortOption(sortBy) // 유효성 검사 및 기본값 처리

    // 3. 전체 노트 개수 조회
    const [countResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.userId, user.id))

    const total = countResult?.count || 0
    const totalPages = Math.ceil(total / limit)

    // 4. 정렬 옵션에 따라 orderBy 절 동적 구성
    const orderByClause = 
      validSortBy === 'latest' ? desc(notes.createdAt) :
      validSortBy === 'oldest' ? asc(notes.createdAt) :
      asc(notes.title) // 'title'

    // 5. 노트 목록 조회 (페이지네이션 + 정렬)
    const offset = (currentPage - 1) * limit
    const notesList = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return {
      success: true,
      data: {
        notes: notesList,
        total,
        page: currentPage,
        pageSize: limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error('노트 목록 조회 실패:', error)
    return {
      success: false,
      error: '노트 목록을 불러올 수 없습니다. 다시 시도해주세요.',
    }
  }
}

/**
 * 노트 상세 조회
 * @param noteId - 조회할 노트 ID
 * @returns 노트 상세 정보 또는 에러 메시지
 */
export async function getNoteById(
  noteId: string
): Promise<{
  success: boolean
  data?: {
    id: string
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
  }
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. 노트 ID 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효하지 않은 노트 ID입니다.',
      }
    }

    // 3. 노트 조회 (사용자 스코프 강제)
    const [note] = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    // 4. 노트 없음 (존재하지 않거나 권한 없음)
    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.',
      }
    }

    return {
      success: true,
      data: note,
    }
  } catch (error) {
    console.error('노트 조회 실패:', error)
    return {
      success: false,
      error: '노트를 불러올 수 없습니다. 다시 시도해주세요.',
    }
  }
}

/**
 * 노트 수정
 * @param noteId - 수정할 노트 ID
 * @param title - 새 제목
 * @param content - 새 본문
 * @returns 수정된 노트 정보 또는 에러 메시지
 */
export async function updateNote(
  noteId: string,
  title: string,
  content: string
): Promise<{
  success: boolean
  data?: {
    id: string
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
  }
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. 노트 ID 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효하지 않은 노트 ID입니다.',
      }
    }

    // 3. 입력값 유효성 검사
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      return {
        success: false,
        error: '제목을 입력해주세요.',
      }
    }

    if (trimmedTitle.length > 500) {
      return {
        success: false,
        error: '제목은 최대 500자까지 입력 가능합니다.',
      }
    }

    if (!trimmedContent) {
      return {
        success: false,
        error: '본문을 입력해주세요.',
      }
    }

    // 4. 노트 업데이트 (사용자 스코프 강제)
    const [updatedNote] = await db
      .update(notes)
      .set({
        title: trimmedTitle,
        content: trimmedContent,
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .returning({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })

    // 5. 노트 없음 (존재하지 않거나 권한 없음)
    if (!updatedNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.',
      }
    }

    return {
      success: true,
      data: updatedNote,
    }
  } catch (error) {
    console.error('노트 수정 실패:', error)
    return {
      success: false,
      error: '저장에 실패했습니다. 다시 시도해주세요.',
    }
  }
}

/**
 * 노트 삭제
 * @param noteId - 삭제할 노트 ID
 * @returns 성공 여부 또는 에러 메시지
 */
export async function deleteNote(
  noteId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. 노트 ID 유효성 검사
    if (!noteId || typeof noteId !== 'string') {
      return {
        success: false,
        error: '유효하지 않은 노트 ID입니다.',
      }
    }

    // 3. 노트 삭제 (사용자 스코프 강제)
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .returning({ id: notes.id })

    // 4. 노트 없음 (존재하지 않거나 권한 없음)
    if (result.length === 0) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('노트 삭제 실패:', error)
    return {
      success: false,
      error: '노트 삭제에 실패했습니다. 다시 시도해주세요.',
    }
  }
}

