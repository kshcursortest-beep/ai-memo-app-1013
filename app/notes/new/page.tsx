// app/notes/new/page.tsx
// 노트 생성 페이지
// 사용자가 새로운 노트를 작성할 수 있는 페이지 (템플릿 지원)
// 관련 파일: components/notes/NoteCreateForm.tsx, app/actions/notes.ts, lib/types/templates.ts

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NoteCreateForm } from '@/components/notes/NoteCreateForm'
import { createNote } from '@/app/actions/notes'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getTemplateById } from '@/lib/types/templates'

export default function NewNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialTitle, setInitialTitle] = useState('')
  const [initialContent, setInitialContent] = useState('')

  // 사용자 인증 확인 및 템플릿 적용
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
      } else {
        // 템플릿 ID가 있으면 템플릿 적용
        const templateId = searchParams.get('template')
        if (templateId) {
          const template = getTemplateById(templateId)
          if (template) {
            setInitialTitle(template.content.title)
            setInitialContent(template.content.body)
            toast.info(`"${template.title}" 템플릿이 적용되었습니다`)
          }
        }
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, searchParams])

  const handleSubmit = async (title: string, content: string) => {
    setIsSubmitting(true)
    
    try {
      const result = await createNote(title, content)

      if (result.success) {
        toast.success('노트가 생성되었습니다!')
        // 노트 목록 페이지로 리다이렉트 또는 홈으로
        router.push('/')
      } else {
        toast.error(result.error || '노트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('노트 생성 오류:', error)
      toast.error('노트 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">새 노트 작성</h1>
        <p className="mt-2 text-gray-600">
          아이디어와 정보를 기록해보세요
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <NoteCreateForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
          initialTitle={initialTitle}
          initialContent={initialContent}
        />
      </div>
    </div>
  )
}

