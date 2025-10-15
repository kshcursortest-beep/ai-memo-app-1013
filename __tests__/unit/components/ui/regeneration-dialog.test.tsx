// __tests__/unit/components/ui/regeneration-dialog.test.tsx
// 재생성 확인 다이얼로그 컴포넌트 단위 테스트
// 다이얼로그 표시, 확인/취소 동작, 재생성 횟수 정보 표시 테스트
// 관련 파일: components/ui/regeneration-dialog.tsx

import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegenerationDialog } from '@/components/ui/regeneration-dialog'

describe('RegenerationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    type: 'summary' as const,
    currentCount: 3,
    limit: 10,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('다이얼로그가 열려있을 때 내용이 표시되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} />)

    expect(screen.getByText('AI 요약 재생성')).toBeInTheDocument()
    expect(screen.getByText('기존 요약을 새로운 AI 결과로 교체합니다.')).toBeInTheDocument()
    expect(screen.getByText('주의사항')).toBeInTheDocument()
    expect(screen.getByText('일일 재생성 한도')).toBeInTheDocument()
  })

  it('태그 재생성일 때 적절한 텍스트가 표시되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} type="tags" />)

    expect(screen.getByText('AI 태그 재생성')).toBeInTheDocument()
    expect(screen.getByText('기존 태그를 새로운 AI 결과로 교체합니다.')).toBeInTheDocument()
  })

  it('재생성 횟수 정보가 올바르게 표시되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} currentCount={7} limit={10} />)

    expect(screen.getByText('오늘 사용: 7회 / 10회')).toBeInTheDocument()
    expect(screen.getByText('(남은 횟수: 3회)')).toBeInTheDocument()
  })

  it('재생성 횟수가 제한에 도달했을 때 남은 횟수가 표시되지 않아야 한다', () => {
    render(<RegenerationDialog {...defaultProps} currentCount={10} limit={10} />)

    expect(screen.getByText('오늘 사용: 10회 / 10회')).toBeInTheDocument()
    expect(screen.queryByText(/남은 횟수/)).not.toBeInTheDocument()
  })

  it('취소 버튼을 클릭하면 onClose가 호출되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} />)

    const cancelButton = screen.getByText('취소')
    fireEvent.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('재생성하기 버튼을 클릭하면 onConfirm이 호출되어야 한다', async () => {
    const mockConfirm = jest.fn().mockResolvedValue(undefined)
    render(<RegenerationDialog {...defaultProps} onConfirm={mockConfirm} />)

    const confirmButton = screen.getByText('재생성하기')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledTimes(1)
    })
  })

  it('로딩 중일 때 버튼들이 비활성화되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} isLoading={true} />)

    const cancelButton = screen.getByText('취소')
    const confirmButton = screen.getByText('재생성 중...')

    expect(cancelButton).toBeDisabled()
    expect(confirmButton).toBeDisabled()
  })

  it('로딩 중일 때 재생성 중... 텍스트가 표시되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} isLoading={true} />)

    expect(screen.getByText('재생성 중...')).toBeInTheDocument()
    expect(screen.queryByText('재생성하기')).not.toBeInTheDocument()
  })

  it('다이얼로그가 닫혀있을 때 내용이 표시되지 않아야 한다', () => {
    render(<RegenerationDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('AI 요약 재생성')).not.toBeInTheDocument()
  })

  it('경고 메시지가 올바르게 표시되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} />)

    expect(screen.getByText('기존 요약이 완전히 삭제되고 새로운 결과로 교체됩니다')).toBeInTheDocument()
    expect(screen.getByText('이 작업은 되돌릴 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText('재생성에는 시간이 소요될 수 있습니다')).toBeInTheDocument()
  })

  it('태그 재생성일 때 경고 메시지가 적절히 수정되어야 한다', () => {
    render(<RegenerationDialog {...defaultProps} type="tags" />)

    expect(screen.getByText('기존 태그가 완전히 삭제되고 새로운 결과로 교체됩니다')).toBeInTheDocument()
  })
})
