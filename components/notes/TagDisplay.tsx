// components/notes/TagDisplay.tsx
// 노트 태그 표시 컴포넌트
// 생성된 태그들을 시각적으로 표시하고 편집 기능 제공
// 관련 파일: app/actions/tags.ts, components/notes/TagGenerator.tsx

'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, Plus, X, Edit3, Save, Trash2 } from 'lucide-react'
import { addTag, removeTag, updateTags } from '@/app/actions/tags'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TagDisplayProps {
  noteId: string
  tags: string[]
  className?: string
  onTagsUpdated?: (tags: string[]) => void
}

export function TagDisplay({ noteId, tags, className = '', onTagsUpdated }: TagDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTags, setEditTags] = useState<string[]>(tags)
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 편집 모드 진입
  const handleStartEdit = () => {
    setEditTags([...tags])
    setIsEditing(true)
  }

  // 편집 취소
  const handleCancel = () => {
    setEditTags([...tags])
    setNewTag('')
    setIsEditing(false)
  }

  // 태그 저장
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const result = await updateTags(noteId, editTags)
      
      if (result.success && result.tags) {
        toast.success('태그가 업데이트되었습니다.')
        onTagsUpdated?.(result.tags)
        setIsEditing(false)
        setNewTag('')
      } else {
        toast.error(result.error || '태그 업데이트에 실패했습니다.')
      }
    } catch (error) {
      toast.error('태그 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 개별 태그 삭제
  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const result = await removeTag(noteId, tagToRemove)
      
      if (result.success && result.tags) {
        toast.success('태그가 삭제되었습니다.')
        onTagsUpdated?.(result.tags)
      } else {
        toast.error(result.error || '태그 삭제에 실패했습니다.')
      }
    } catch (error) {
      toast.error('태그 삭제 중 오류가 발생했습니다.')
    }
  }

  // 새 태그 추가
  const handleAddTag = async () => {
    if (!newTag.trim()) return

    try {
      const result = await addTag(noteId, newTag.trim())
      
      if (result.success && result.tags) {
        toast.success('태그가 추가되었습니다.')
        onTagsUpdated?.(result.tags)
        setNewTag('')
      } else {
        toast.error(result.error || '태그 추가에 실패했습니다.')
      }
    } catch (error) {
      toast.error('태그 추가 중 오류가 발생했습니다.')
    }
  }

  // 편집 모드에서 태그 삭제
  const handleEditRemoveTag = (index: number) => {
    setEditTags(editTags.filter((_, i) => i !== index))
  }

  // 편집 모드에서 새 태그 추가
  const handleEditAddTag = () => {
    if (!newTag.trim() || editTags.includes(newTag.trim())) return
    
    if (editTags.length >= 6) {
      toast.error('최대 6개의 태그만 추가할 수 있습니다.')
      return
    }

    setEditTags([...editTags, newTag.trim()])
    setNewTag('')
  }

  // 태그가 없는 경우 빈 상태 표시
  if (!tags || tags.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" />
            태그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            아직 생성된 태그가 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" />
            태그 ({tags.length}개)
          </CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="h-6 px-2 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              편집
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 태그 표시 */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-1 flex items-center gap-1"
            >
              {tag}
              {!isEditing && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                  aria-label={`${tag} 태그 삭제`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        {/* 편집 모드 */}
        {isEditing && (
          <div className="space-y-3 border-t pt-3">
            {/* 편집 중인 태그들 */}
            <div className="flex flex-wrap gap-2">
              {editTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-1 flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleEditRemoveTag(index)}
                    className="hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                    aria-label={`${tag} 태그 삭제`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* 새 태그 추가 */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="새 태그 입력..."
                className="text-xs h-8"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleEditAddTag()
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleEditAddTag}
                disabled={!newTag.trim() || editTags.includes(newTag.trim()) || editTags.length >= 6}
                className="h-8 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* 편집 액션 버튼들 */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 px-3 text-xs"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3 text-xs gap-1"
              >
                <Save className="h-3 w-3" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
