// app/notes/new/page.tsx
// 노트 생성 페이지
// 사용자가 새로운 노트를 작성할 수 있는 페이지 (템플릿 지원, 임시 저장)
// 관련 파일: components/notes/NoteCreateForm.tsx, app/actions/notes.ts, lib/types/templates.ts, lib/utils/draftStorage.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NoteCreateForm } from '@/components/notes/NoteCreateForm'
import { createNote } from '@/app/actions/notes'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getTemplateById } from '@/lib/types/templates'
import { getDraft, saveDraft, clearDraft } from '@/lib/utils/draftStorage'
import { DraftRecoveryDialog } from '@/components/notes/DraftRecoveryDialog'
import { DraftStatusIndicator } from '@/components/notes/DraftStatusIndicator'
import type { DraftStatus, NoteDraft } from '@/lib/types/draft'

export default function NewNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialTitle, setInitialTitle] = useState('')
  const [initialContent, setInitialContent] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle')
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [recoveredDraft, setRecoveredDraft] = useState<NoteDraft | null>(null)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentContent, setCurrentContent] = useState('')

  // 사용자 인증 확인 및 템플릿/임시 저장 적용
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // 임시 저장 확인
      const draft = getDraft(user.id)
      if (draft) {
        setRecoveredDraft(draft)
        setShowDraftDialog(true)
        setIsLoading(false)
        return
      }

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

    checkAuth()
  }, [router, searchParams])

  // 임시 저장 (1초 디바운스)
  useEffect(() => {
    if (!userId || isSubmitting) return

    // 제목과 본문이 모두 비어있으면 저장하지 않음
    if (!currentTitle.trim() && !currentContent.trim()) return

    setDraftStatus('saving')

    const timeoutId = setTimeout(() => {
      const success = saveDraft(userId, currentTitle, currentContent)
      if (success) {
        setDraftStatus('saved')
      } else {
        setDraftStatus('idle')
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentTitle, currentContent, userId, isSubmitting])

  // 임시 저장 복구
  const handleRecoverDraft = useCallback(() => {
    if (recoveredDraft) {
      setInitialTitle(recoveredDraft.title)
      setInitialContent(recoveredDraft.content)
      setCurrentTitle(recoveredDraft.title)
      setCurrentContent(recoveredDraft.content)
      setShowDraftDialog(false)
      toast.success('임시 저장된 내용을 복구했습니다')
    }
  }, [recoveredDraft])

  // 임시 저장 폐기
  const handleDiscardDraft = useCallback(() => {
    if (userId) {
      clearDraft(userId)
      setShowDraftDialog(false)
      toast.info('임시 저장된 내용을 폐기했습니다')
    }
  }, [userId])

  // 제목/본문 변경 추적
  const handleTitleChange = useCallback((title: string) => {
    setCurrentTitle(title)
  }, [])

  const handleContentChange = useCallback((content: string) => {
    setCurrentContent(content)
  }, [])

  const handleSubmit = async (title: string, content: string) => {
    setIsSubmitting(true)
    
    try {
      const result = await createNote(title, content)

      if (result.success) {
        // 임시 저장 삭제
        if (userId) {
          clearDraft(userId)
        }
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
    <>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">새 노트 작성</h1>
            <p className="mt-2 text-gray-600">
              아이디어와 정보를 기록해보세요
            </p>
          </div>
          {/* 임시 저장 상태 표시 */}
          <DraftStatusIndicator status={draftStatus} />
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <NoteCreateForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            initialTitle={initialTitle}
            initialContent={initialContent}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
          />
        </div>
      </div>

      {/* 임시 저장 복구 다이얼로그 */}
      <DraftRecoveryDialog
        open={showDraftDialog}
        draft={recoveredDraft}
        onRecover={handleRecoverDraft}
        onDiscard={handleDiscardDraft}
      />
    </>
  )
}

