// components/ui/inline-editor.tsx
// 인라인 텍스트 에디터 컴포넌트
// 요약 편집을 위한 텍스트 에디터 기능 제공
// 관련 파일: components/notes/SummaryDisplay.tsx, app/actions/summaries.ts

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Save, X, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditorProps {
  value: string
  onSave: (newValue: string) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
  placeholder?: string
  maxLength?: number
  className?: string
  disabled?: boolean
}

/**
 * 인라인 텍스트 에디터 컴포넌트
 * @param value - 편집할 텍스트 값
 * @param onSave - 저장 콜백 함수
 * @param onCancel - 취소 콜백 함수
 * @param placeholder - 플레이스홀더 텍스트
 * @param maxLength - 최대 길이 제한
 * @param className - 추가 CSS 클래스
 * @param disabled - 비활성화 상태
 */
export function InlineEditor({
  value,
  onSave,
  onCancel,
  placeholder = '내용을 입력하세요...',
  maxLength = 1000,
  className = '',
  disabled = false,
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 편집 모드 진입 시 텍스트 영역에 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // 편집 시작
  const handleStartEdit = () => {
    if (disabled) return
    setEditValue(value)
    setError(null)
    setIsEditing(true)
  }

  // 편집 취소
  const handleCancel = () => {
    setEditValue(value)
    setError(null)
    setIsEditing(false)
    onCancel?.()
  }

  // 저장 처리
  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    if (editValue.trim().length === 0) {
      setError('내용을 입력해주세요.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await onSave(editValue.trim())
      
      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || '저장에 실패했습니다.')
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  // 편집 모드가 아닐 때
  if (!isEditing) {
    return (
      <div className={cn('group relative', className)}>
        <div 
          className="cursor-pointer rounded-md p-2 hover:bg-gray-50 transition-colors"
          onClick={handleStartEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleStartEdit()
            }
          }}
          aria-label="편집하려면 클릭하세요"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {value.split('\n').map((line, index) => (
                <p key={index} className="text-sm leading-relaxed text-gray-900">
                  {line || '\u00A0'} {/* 빈 줄도 공간 확보 */}
                </p>
              ))}
            </div>
            <Edit3 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
          </div>
        </div>
      </div>
    )
  }

  // 편집 모드일 때
  return (
    <div className={cn('space-y-3', className)}>
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className="min-h-[120px] resize-none"
        disabled={isSaving}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {editValue.length}/{maxLength}자
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            취소
          </Button>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || editValue.trim().length === 0}
            className="gap-1"
          >
            <Save className="h-3 w-3" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        팁: Ctrl+Enter로 저장, Esc로 취소
      </div>
    </div>
  )
}
