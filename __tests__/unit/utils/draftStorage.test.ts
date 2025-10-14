// __tests__/unit/utils/draftStorage.test.ts
// 임시 저장 유틸리티 함수 단위 테스트
// 로컬 스토리지 CRUD 작업 및 에러 처리 테스트
// 관련 파일: lib/utils/draftStorage.ts

import {
  saveDraft,
  getDraft,
  clearDraft,
  hasDraft,
} from '@/lib/utils/draftStorage'
import type { NoteDraft } from '@/lib/types/draft'

// 로컬 스토리지 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('draftStorage Utils', () => {
  const userId = 'test-user-123'
  const draftKey = `note-draft-${userId}`

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('saveDraft', () => {
    it('제목과 본문을 로컬 스토리지에 저장한다', () => {
      const title = '테스트 노트'
      const content = '테스트 내용입니다'

      const result = saveDraft(userId, title, content)

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        draftKey,
        expect.any(String)
      )

      const savedData = JSON.parse(
        localStorageMock.getItem(draftKey) as string
      ) as NoteDraft
      expect(savedData.title).toBe(title)
      expect(savedData.content).toBe(content)
      expect(savedData.userId).toBe(userId)
      expect(savedData.savedAt).toBeDefined()
    })

    it('제목과 본문이 모두 비어있으면 저장하지 않는다', () => {
      const result = saveDraft(userId, '', '')

      expect(result).toBe(false)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('제목만 있으면 저장한다', () => {
      const result = saveDraft(userId, '제목만', '')

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('본문만 있으면 저장한다', () => {
      const result = saveDraft(userId, '', '본문만')

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('공백만 있는 제목과 본문은 저장하지 않는다', () => {
      const result = saveDraft(userId, '   ', '  \n  ')

      expect(result).toBe(false)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('로컬 스토리지 오류 시 false를 반환한다', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const result = saveDraft(userId, '제목', '내용')

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getDraft', () => {
    it('저장된 임시 저장 데이터를 조회한다', () => {
      const title = '저장된 제목'
      const content = '저장된 내용'
      const savedAt = new Date().toISOString()

      const draft: NoteDraft = {
        title,
        content,
        savedAt,
        userId,
      }

      localStorageMock.setItem(draftKey, JSON.stringify(draft))

      const result = getDraft(userId)

      expect(result).toEqual(draft)
    })

    it('저장된 데이터가 없으면 null을 반환한다', () => {
      const result = getDraft(userId)

      expect(result).toBeNull()
    })

    it('userId가 불일치하면 null을 반환한다', () => {
      const draft: NoteDraft = {
        title: '제목',
        content: '내용',
        savedAt: new Date().toISOString(),
        userId: 'different-user',
      }

      localStorageMock.setItem(draftKey, JSON.stringify(draft))

      const result = getDraft(userId)

      expect(result).toBeNull()
    })

    it('손상된 JSON 데이터는 삭제하고 null을 반환한다', () => {
      localStorageMock.setItem(draftKey, '{ invalid json }')

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const result = getDraft(userId)

      expect(result).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(draftKey)
      consoleSpy.mockRestore()
    })

    it('유효하지 않은 데이터 형식은 삭제하고 null을 반환한다', () => {
      const invalidDraft = {
        title: 123, // 숫자 (문자열이어야 함)
        content: '내용',
        savedAt: new Date().toISOString(),
        userId,
      }

      localStorageMock.setItem(draftKey, JSON.stringify(invalidDraft))

      const result = getDraft(userId)

      expect(result).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(draftKey)
    })
  })

  describe('clearDraft', () => {
    it('임시 저장 데이터를 삭제한다', () => {
      const draft: NoteDraft = {
        title: '제목',
        content: '내용',
        savedAt: new Date().toISOString(),
        userId,
      }

      localStorageMock.setItem(draftKey, JSON.stringify(draft))

      clearDraft(userId)

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(draftKey)
      expect(getDraft(userId)).toBeNull()
    })

    it('로컬 스토리지 오류 시 에러를 무시한다', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('SecurityError')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      expect(() => clearDraft(userId)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('hasDraft', () => {
    it('임시 저장 데이터가 있으면 true를 반환한다', () => {
      saveDraft(userId, '제목', '내용')

      const result = hasDraft(userId)

      expect(result).toBe(true)
    })

    it('임시 저장 데이터가 없으면 false를 반환한다', () => {
      const result = hasDraft(userId)

      expect(result).toBe(false)
    })

    it('손상된 데이터는 false를 반환한다', () => {
      localStorageMock.setItem(draftKey, '{ invalid }')

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const result = hasDraft(userId)

      expect(result).toBe(false)
      consoleSpy.mockRestore()
    })
  })
})

