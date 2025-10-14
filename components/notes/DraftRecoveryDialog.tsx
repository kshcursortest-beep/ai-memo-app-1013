// components/notes/DraftRecoveryDialog.tsx
// 임시 저장 복구 다이얼로그 컴포넌트
// 임시 저장된 노트를 복구하거나 폐기하는 선택지 제공
// 관련 파일: app/notes/new/page.tsx, lib/types/draft.ts

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NoteDraft } from '@/lib/types/draft'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DraftRecoveryDialogProps {
  open: boolean
  draft: NoteDraft | null
  onRecover: () => void
  onDiscard: () => void
}

export function DraftRecoveryDialog({
  open,
  draft,
  onRecover,
  onDiscard,
}: DraftRecoveryDialogProps) {
  if (!draft) {
    return null
  }

  // 상대 시간 계산
  const savedTimeAgo = formatDistanceToNow(new Date(draft.savedAt), {
    addSuffix: true,
    locale: ko,
  })

  // 미리보기 텍스트 (제목 50자, 본문 100자 제한)
  const previewTitle =
    draft.title.length > 50 ? draft.title.substring(0, 50) + '...' : draft.title
  const previewContent =
    draft.content.length > 100
      ? draft.content.substring(0, 100) + '...'
      : draft.content

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>임시 저장된 노트를 발견했습니다</DialogTitle>
          <DialogDescription>
            {savedTimeAgo} 저장된 노트가 있습니다. 계속 작성하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제목 미리보기 */}
          {previewTitle && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">제목</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                {previewTitle}
              </p>
            </div>
          )}

          {/* 본문 미리보기 */}
          {previewContent && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">본문</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border whitespace-pre-wrap">
                {previewContent}
              </p>
            </div>
          )}

          {/* 저장 시간 */}
          <p className="text-xs text-gray-500">
            저장 시간: {new Date(draft.savedAt).toLocaleString('ko-KR')}
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            aria-label="임시 저장 내용 폐기"
          >
            폐기하기
          </Button>
          <Button onClick={onRecover} aria-label="임시 저장 내용 복구" autoFocus>
            복구하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

