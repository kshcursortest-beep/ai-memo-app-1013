// components/notes/NoteCreateForm.tsx
// 노트 생성 폼 컴포넌트
// 제목과 본문 입력, 유효성 검사, 로딩 상태 관리
// 관련 파일: app/notes/new/page.tsx, app/actions/notes.ts

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { validateNote } from '@/lib/utils/validation'
import { Loader2 } from 'lucide-react'

interface NoteCreateFormProps {
  onSubmit: (title: string, content: string) => Promise<void>
  isSubmitting?: boolean
}

export function NoteCreateForm({ onSubmit, isSubmitting = false }: NoteCreateFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 클라이언트 측 유효성 검사
    const validation = validateNote(title, content)
    
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    // 에러 초기화
    setErrors({})

    // Server Action 호출
    await onSubmit(title, content)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    // 입력 중 에러 메시지 제거
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }))
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // 입력 중 에러 메시지 제거
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: undefined }))
    }
  }

  const clearForm = () => {
    setTitle('')
    setContent('')
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          제목 <span className="text-sm text-gray-500">({title.length}/500)</span>
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="노트 제목을 입력하세요"
          maxLength={500}
          disabled={isSubmitting}
          className={errors.title ? 'border-red-500' : ''}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-red-500">
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">본문</Label>
        <Textarea
          id="content"
          value={content}
          onChange={handleContentChange}
          placeholder="노트 내용을 입력하세요"
          rows={10}
          disabled={isSubmitting}
          className={errors.content ? 'border-red-500' : ''}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? 'content-error' : undefined}
        />
        {errors.content && (
          <p id="content-error" className="text-sm text-red-500">
            {errors.content}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            '노트 생성'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearForm}
          disabled={isSubmitting}
        >
          취소
        </Button>
      </div>
    </form>
  )
}

