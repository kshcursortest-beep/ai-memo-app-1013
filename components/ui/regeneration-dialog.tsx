// components/ui/regeneration-dialog.tsx
// AI 재생성 확인 다이얼로그 컴포넌트
// 사용자에게 재생성 확인을 받고 제한 정보를 표시
// 관련 파일: app/actions/regenerations.ts, components/ui/dialog.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, RefreshCw, Info } from 'lucide-react'
import type { RegenerationType } from '@/app/actions/regenerations'

interface RegenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: RegenerationType
  currentCount?: number
  limit?: number
  isLoading?: boolean
}

export function RegenerationDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  currentCount = 0,
  limit = 10,
  isLoading = false,
}: RegenerationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const typeLabel = type === 'summary' ? '요약' : '태그'
  const remainingCount = limit - currentCount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            AI {typeLabel} 재생성
          </DialogTitle>
          <DialogDescription>
            기존 {typeLabel}을 새로운 AI 결과로 교체합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 경고 메시지 */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">주의사항</p>
              <ul className="space-y-1 text-xs">
                <li>• 기존 {typeLabel}이 완전히 삭제되고 새로운 결과로 교체됩니다</li>
                <li>• 이 작업은 되돌릴 수 없습니다</li>
                <li>• 재생성에는 시간이 소요될 수 있습니다</li>
              </ul>
            </div>
          </div>

          {/* 재생성 횟수 정보 */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">일일 재생성 한도</p>
              <p className="text-xs">
                오늘 사용: {currentCount}회 / {limit}회
                {remainingCount > 0 && (
                  <span className="text-green-600 ml-1">
                    (남은 횟수: {remainingCount}회)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isConfirming}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isConfirming}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading || isConfirming ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                재생성하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
