// __tests__/unit/lib/templates.test.ts
// 노트 템플릿 타입 및 유틸리티 함수 단위 테스트
// 템플릿 조회 및 데이터 구조 검증
// 관련 파일: lib/types/templates.ts

import { NOTE_TEMPLATES, getTemplateById } from '@/lib/types/templates'

describe('NOTE_TEMPLATES', () => {
  it('3개의 템플릿을 정의한다', () => {
    expect(NOTE_TEMPLATES).toHaveLength(3)
  })

  it('모든 템플릿이 필수 필드를 가진다', () => {
    NOTE_TEMPLATES.forEach((template) => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('title')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('icon')
      expect(template).toHaveProperty('content')
      expect(template.content).toHaveProperty('title')
      expect(template.content).toHaveProperty('body')
    })
  })

  it('회의 노트 템플릿이 정의되어 있다', () => {
    const meetingTemplate = NOTE_TEMPLATES.find((t) => t.id === 'meeting')
    expect(meetingTemplate).toBeDefined()
    expect(meetingTemplate?.title).toBe('회의 노트')
    expect(meetingTemplate?.icon).toBe('Users')
  })

  it('아이디어 메모 템플릿이 정의되어 있다', () => {
    const ideaTemplate = NOTE_TEMPLATES.find((t) => t.id === 'idea')
    expect(ideaTemplate).toBeDefined()
    expect(ideaTemplate?.title).toBe('아이디어 메모')
    expect(ideaTemplate?.icon).toBe('Lightbulb')
  })

  it('할 일 목록 템플릿이 정의되어 있다', () => {
    const todoTemplate = NOTE_TEMPLATES.find((t) => t.id === 'todo')
    expect(todoTemplate).toBeDefined()
    expect(todoTemplate?.title).toBe('할 일 목록')
    expect(todoTemplate?.icon).toBe('CheckSquare')
  })

  it('모든 템플릿 ID가 고유하다', () => {
    const ids = NOTE_TEMPLATES.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('getTemplateById', () => {
  it('유효한 템플릿 ID로 템플릿을 조회한다 - meeting', () => {
    const template = getTemplateById('meeting')
    expect(template).toBeDefined()
    expect(template?.id).toBe('meeting')
    expect(template?.title).toBe('회의 노트')
  })

  it('유효한 템플릿 ID로 템플릿을 조회한다 - idea', () => {
    const template = getTemplateById('idea')
    expect(template).toBeDefined()
    expect(template?.id).toBe('idea')
    expect(template?.title).toBe('아이디어 메모')
  })

  it('유효한 템플릿 ID로 템플릿을 조회한다 - todo', () => {
    const template = getTemplateById('todo')
    expect(template).toBeDefined()
    expect(template?.id).toBe('todo')
    expect(template?.title).toBe('할 일 목록')
  })

  it('잘못된 템플릿 ID로 조회하면 undefined를 반환한다', () => {
    const template = getTemplateById('invalid')
    expect(template).toBeUndefined()
  })

  it('빈 문자열로 조회하면 undefined를 반환한다', () => {
    const template = getTemplateById('')
    expect(template).toBeUndefined()
  })

  it('조회한 템플릿의 content 구조가 올바르다', () => {
    const template = getTemplateById('meeting')
    expect(template?.content).toHaveProperty('title')
    expect(template?.content).toHaveProperty('body')
    expect(typeof template?.content.title).toBe('string')
    expect(typeof template?.content.body).toBe('string')
  })

  it('회의 노트 템플릿의 본문에 마크다운 구조가 포함되어 있다', () => {
    const template = getTemplateById('meeting')
    expect(template?.content.body).toContain('## 참석자')
    expect(template?.content.body).toContain('## 안건')
    expect(template?.content.body).toContain('## 결정 사항')
    expect(template?.content.body).toContain('## 액션 아이템')
  })

  it('아이디어 메모 템플릿의 본문에 마크다운 구조가 포함되어 있다', () => {
    const template = getTemplateById('idea')
    expect(template?.content.body).toContain('## 핵심 아이디어')
    expect(template?.content.body).toContain('## 배경/동기')
    expect(template?.content.body).toContain('## 다음 단계')
  })

  it('할 일 목록 템플릿의 본문에 체크박스 항목이 포함되어 있다', () => {
    const template = getTemplateById('todo')
    expect(template?.content.body).toContain('## 오늘의 목표')
    expect(template?.content.body).toContain('## 할 일')
    expect(template?.content.body).toContain('- [ ]')
  })
})

