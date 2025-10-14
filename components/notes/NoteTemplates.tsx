// components/notes/NoteTemplates.tsx
// 노트 작성 템플릿 제안 컴포넌트
// 미리 정의된 템플릿을 카드 형태로 표시하고, 선택 시 노트 작성 페이지로 이동
// 관련 파일: lib/types/templates.ts, app/notes/new/page.tsx, components/notes/EmptyState.tsx

'use client'

import { useRouter } from 'next/navigation'
import { NOTE_TEMPLATES } from '@/lib/types/templates'
import { Users, Lightbulb, CheckSquare, LucideIcon } from 'lucide-react'

// 아이콘 매핑
const iconMap: Record<string, LucideIcon> = {
  Users,
  Lightbulb,
  CheckSquare,
}

export function NoteTemplates() {
  const router = useRouter()

  const handleTemplateSelect = (templateId: string) => {
    router.push(`/notes/new?template=${templateId}`)
  }

  return (
    <div className="w-full max-w-3xl mt-8">
      <h4 className="text-sm font-medium text-gray-700 mb-4">
        또는 템플릿으로 시작하기
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NOTE_TEMPLATES.map((template) => {
          const Icon = iconMap[template.icon]
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`${template.title} 템플릿으로 노트 작성`}
            >
              {Icon && (
                <Icon className="h-8 w-8 mb-2 text-primary" aria-hidden="true" />
              )}
              <h5 className="font-medium mb-1">{template.title}</h5>
              <p className="text-sm text-gray-600">{template.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

