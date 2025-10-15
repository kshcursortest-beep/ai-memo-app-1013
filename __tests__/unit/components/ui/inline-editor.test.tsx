// __tests__/unit/components/ui/inline-editor.test.tsx
// 인라인 에디터 컴포넌트 테스트
// 편집 모드 전환, 저장, 취소 기능 테스트
// 관련 파일: components/ui/inline-editor.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineEditor } from '@/components/ui/inline-editor'

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('InlineEditor', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태에서 텍스트를 표시해야 한다', () => {
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('테스트 텍스트')).toBeInTheDocument()
  })

  it('텍스트를 클릭하면 편집 모드로 전환해야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    expect(screen.getByDisplayValue('테스트 텍스트')).toBeInTheDocument()
    expect(screen.getByText('저장')).toBeInTheDocument()
    expect(screen.getByText('취소')).toBeInTheDocument()
  })

  it('편집 모드에서 텍스트를 수정할 수 있어야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트 텍스트')
    await user.clear(textarea)
    await user.type(textarea, '수정된 텍스트')

    expect(textarea).toHaveValue('수정된 텍스트')
  })

  it('저장 버튼을 클릭하면 onSave가 호출되어야 한다', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValue({ success: true })
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트 텍스트')
    await user.clear(textarea)
    await user.type(textarea, '수정된 텍스트')

    const saveButton = screen.getByText('저장')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('수정된 텍스트')
    })
  })

  it('취소 버튼을 클릭하면 편집 모드가 종료되어야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const cancelButton = screen.getByText('취소')
    await user.click(cancelButton)

    expect(screen.getByText('테스트 텍스트')).toBeInTheDocument()
    expect(screen.queryByText('저장')).not.toBeInTheDocument()
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('Escape 키를 누르면 편집이 취소되어야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트 텍스트')
    await user.type(textarea, '{Escape}')

    expect(screen.getByText('테스트 텍스트')).toBeInTheDocument()
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('Ctrl+Enter를 누르면 저장되어야 한다', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValue({ success: true })
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트 텍스트')
    await user.clear(textarea)
    await user.type(textarea, '수정된 텍스트')
    await user.type(textarea, '{Control>}{Enter}{/Control}')

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('수정된 텍스트')
    })
  })

  it('빈 텍스트로 저장하려고 하면 에러가 표시되어야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트 텍스트')
    await user.clear(textarea)

    const saveButton = screen.getByText('저장')
    await user.click(saveButton)

    expect(screen.getByText('내용을 입력해주세요.')).toBeInTheDocument()
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('저장 실패 시 에러 메시지가 표시되어야 한다', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValue({ success: false, error: '저장 실패' })
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트 텍스트')
    await user.clear(textarea)
    await user.type(textarea, '수정된 텍스트')

    const saveButton = screen.getByText('저장')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('저장 실패')).toBeInTheDocument()
    })
  })

  it('최대 길이 제한이 적용되어야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        maxLength={10}
      />
    )

    const textElement = screen.getByText('테스트')
    await user.click(textElement)

    const textarea = screen.getByDisplayValue('테스트')
    expect(textarea).toHaveAttribute('maxLength', '10')
  })

  it('문자 수 표시가 정확해야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        maxLength={100}
      />
    )

    const textElement = screen.getByText('테스트')
    await user.click(textElement)

    expect(screen.getByText('3/100자')).toBeInTheDocument()
  })

  it('비활성화 상태에서는 편집할 수 없어야 한다', async () => {
    const user = userEvent.setup()
    
    render(
      <InlineEditor
        value="테스트 텍스트"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        disabled={true}
      />
    )

    const textElement = screen.getByText('테스트 텍스트')
    await user.click(textElement)

    expect(screen.queryByDisplayValue('테스트 텍스트')).not.toBeInTheDocument()
  })
})
