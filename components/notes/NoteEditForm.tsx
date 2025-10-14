// components/notes/NoteEditForm.tsx
// 노트 편집 폼 컴포넌트
// 제목/본문 편집, 실시간 자동 저장, 유효성 검사
// 관련 파일: app/actions/notes.ts, components/ui/input.tsx, components/ui/textarea.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateNote, deleteNote } from '@/app/actions/notes'
import { formatDate } from '@/lib/utils/dateFormat'
import { toast } from 'sonner'

interface NoteEditFormProps {
  note: {
    id: string
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
  }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function NoteEditForm({ note }: NoteEditFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [originalTitle, setOriginalTitle] = useState(note.title)
  const [originalContent, setOriginalContent] = useState(note.content)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})
  const [lastSaved, setLastSaved] = useState<Date>(note.updatedAt)
  const [isDeleting, setIsDeleting] = useState(false)

  // 변경사항 감지
  const hasChanges = title !== originalTitle || content !== originalContent

  // 유효성 검사
  const validate = useCallback(() => {
    const newErrors: { title?: string; content?: string } = {}

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요'
    } else if (title.trim().length > 500) {
      newErrors.title = '제목은 최대 500자까지 입력 가능합니다'
    }

    if (!content.trim()) {
      newErrors.content = '본문을 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, content])

  // 자동 저장 (디바운스)
  useEffect(() => {
    if (!isEditing || !hasChanges) {
      return
    }

    if (!validate()) {
      return
    }

    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving')

      try {
        const result = await updateNote(note.id, title, content)

        if (result.success && result.data) {
          setSaveStatus('saved')
          setOriginalTitle(result.data.title)
          setOriginalContent(result.data.content)
          setLastSaved(result.data.updatedAt)

          // "저장됨" 상태를 2초간 표시 후 idle로 전환
          setTimeout(() => {
            setSaveStatus('idle')
          }, 2000)

          // 페이지 데이터 갱신
          router.refresh()
        } else {
          setSaveStatus('error')
          toast.error(result.error || '저장에 실패했습니다')

          // 에러 상태를 3초간 표시 후 idle로 전환
          setTimeout(() => {
            setSaveStatus('idle')
          }, 3000)
        }
      } catch (error) {
        console.error('저장 실패:', error)
        setSaveStatus('error')
        toast.error('저장에 실패했습니다. 다시 시도해주세요.')

        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      }
    }, 2000) // 2초 디바운스

    return () => clearTimeout(timeoutId)
  }, [isEditing, title, content, hasChanges, note.id, validate, router])

  // 페이지 나가기 전 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && saveStatus === 'idle') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges, saveStatus])

  // 편집 모드 시작
  const handleEdit = () => {
    setIsEditing(true)
  }

  // 편집 취소
  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = confirm('저장되지 않은 변경사항이 있습니다. 편집을 취소하시겠습니까?')
      if (!confirmed) {
        return
      }
    }

    setTitle(originalTitle)
    setContent(originalContent)
    setErrors({})
    setSaveStatus('idle')
    setIsEditing(false)
  }

  // 노트 삭제
  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteNote(note.id)

      if (result.success) {
        toast.success('노트가 삭제되었습니다')
        router.push('/')
      } else {
        toast.error(result.error || '노트 삭제에 실패했습니다')
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      toast.error('노트 삭제에 실패했습니다. 다시 시도해주세요.')
      setIsDeleting(false)
    }
  }

  // 수동 저장 (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isEditing && hasChanges && validate()) {
          // 디바운스 타이머를 무시하고 즉시 저장
          setSaveStatus('saving')
          updateNote(note.id, title, content).then((result) => {
            if (result.success && result.data) {
              setSaveStatus('saved')
              setOriginalTitle(result.data.title)
              setOriginalContent(result.data.content)
              setLastSaved(result.data.updatedAt)
              toast.success('저장되었습니다')
              setTimeout(() => setSaveStatus('idle'), 2000)
              router.refresh()
            } else {
              setSaveStatus('error')
              toast.error(result.error || '저장에 실패했습니다')
              setTimeout(() => setSaveStatus('idle'), 3000)
            }
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, hasChanges, title, content, note.id, validate, router])

  const isModified = lastSaved.getTime() !== note.createdAt.getTime()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 네비게이션 및 저장 상태 */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => router.push('/')}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            목록으로
          </Button>

          {/* 저장 상태 인디케이터 */}
          {isEditing && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>저장 중...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span>저장됨</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>저장 실패</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 노트 내용 */}
        <article className="bg-white rounded-lg shadow-sm p-8">
          <header className="mb-6">
            {/* 제목 */}
            {isEditing ? (
              <div className="mb-4">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="노트 제목"
                  className="text-3xl font-bold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  maxLength={500}
                  aria-label="노트 제목"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {title.length} / 500자
                </p>
              </div>
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 mb-4 break-words">
                {title}
              </h1>
            )}

            {/* 날짜 및 버튼 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-1 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="font-medium">작성일:</span>
                  <time dateTime={note.createdAt.toISOString()}>
                    {formatDate(note.createdAt)}
                  </time>
                </div>
                {isModified && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">수정일:</span>
                    <time dateTime={lastSaved.toISOString()}>
                      {formatDate(lastSaved)}
                    </time>
                  </div>
                )}
              </div>

              {/* 편집 버튼 */}
              {!isEditing ? (
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeleting}>
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            삭제 중...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            삭제
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>노트 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          정말 이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button onClick={handleEdit}>수정</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                </div>
              )}
            </div>
          </header>

          {/* 본문 */}
          <main>
            {isEditing ? (
              <div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="노트 내용을 입력하세요..."
                  className="min-h-[300px] text-base resize-none border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="노트 본문"
                />
                {errors.content && (
                  <p className="mt-2 text-sm text-red-600">{errors.content}</p>
                )}
              </div>
            ) : (
              <p className="text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                {content}
              </p>
            )}
          </main>
        </article>
      </div>
    </div>
  )
}

