// lib/types/templates.ts
// 노트 템플릿 타입 정의 및 상수
// 노트 작성 시 사용할 미리 정의된 템플릿
// 관련 파일: components/notes/NoteTemplates.tsx, app/notes/new/page.tsx

export interface NoteTemplate {
  id: string
  title: string
  description: string
  icon: string
  content: {
    title: string
    body: string
  }
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting',
    title: '회의 노트',
    description: '회의 내용과 액션 아이템 정리',
    icon: 'Users',
    content: {
      title: '회의 노트 - ',
      body: '## 참석자\n\n\n## 안건\n\n\n## 결정 사항\n\n\n## 액션 아이템\n\n',
    },
  },
  {
    id: 'idea',
    title: '아이디어 메모',
    description: '떠오른 아이디어를 빠르게 기록',
    icon: 'Lightbulb',
    content: {
      title: '💡 아이디어 - ',
      body: '## 핵심 아이디어\n\n\n## 배경/동기\n\n\n## 다음 단계\n\n',
    },
  },
  {
    id: 'todo',
    title: '할 일 목록',
    description: '오늘 해야 할 일 정리',
    icon: 'CheckSquare',
    content: {
      title: '할 일 목록 - ',
      body: '## 오늘의 목표\n\n\n## 할 일\n- [ ] \n- [ ] \n- [ ] \n\n## 메모\n\n',
    },
  },
]

export function getTemplateById(id: string): NoteTemplate | undefined {
  return NOTE_TEMPLATES.find((template) => template.id === id)
}

