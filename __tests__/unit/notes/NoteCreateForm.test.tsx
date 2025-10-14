// __tests__/unit/notes/NoteCreateForm.test.tsx
// 노트 생성 폼 컴포넌트 단위 테스트
// 폼 렌더링, 입력 상호작용, 유효성 검사 검증
// 관련 파일: components/notes/NoteCreateForm.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteCreateForm } from '@/components/notes/NoteCreateForm'

describe('NoteCreateForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('폼 렌더링', () => {
    it('제목 입력 필드를 렌더링한다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      expect(titleInput).toBeInTheDocument()
      expect(titleInput).toHaveAttribute('placeholder', '노트 제목을 입력하세요')
    })

    it('본문 입력 필드를 렌더링한다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const contentTextarea = screen.getByLabelText('본문')
      expect(contentTextarea).toBeInTheDocument()
      expect(contentTextarea).toHaveAttribute('placeholder', '노트 내용을 입력하세요')
    })

    it('노트 생성 버튼을 렌더링한다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      expect(submitButton).toBeInTheDocument()
    })

    it('취소 버튼을 렌더링한다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const cancelButton = screen.getByRole('button', { name: '취소' })
      expect(cancelButton).toBeInTheDocument()
    })

    it('글자 수 카운터를 표시한다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('(0/500)')).toBeInTheDocument()
    })
  })

  describe('입력 필드 상호작용', () => {
    it('제목 입력 시 값이 업데이트된다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/) as HTMLInputElement
      await user.type(titleInput, 'Test Title')

      expect(titleInput.value).toBe('Test Title')
    })

    it('본문 입력 시 값이 업데이트된다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const contentTextarea = screen.getByLabelText('본문') as HTMLTextAreaElement
      await user.type(contentTextarea, 'Test Content')

      expect(contentTextarea.value).toBe('Test Content')
    })

    it('제목 입력 시 글자 수 카운터가 업데이트된다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Hello')

      expect(screen.getByText('(5/500)')).toBeInTheDocument()
    })

    it('제목은 최대 500자까지 입력 가능하다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      expect(titleInput).toHaveAttribute('maxLength', '500')
    })
  })

  describe('유효성 검사', () => {
    it('제목이 비어있으면 에러 메시지를 표시한다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const contentTextarea = screen.getByLabelText('본문')
      await user.type(contentTextarea, 'Test Content')

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('본문이 비어있으면 에러 메시지를 표시한다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Test Title')

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('본문을 입력해주세요.')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('입력 중 에러 메시지가 사라진다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      // 먼저 에러 발생
      const contentTextarea = screen.getByLabelText('본문')
      await user.type(contentTextarea, 'Test Content')

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument()
      })

      // 제목 입력 시 에러 메시지 사라짐
      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'T')

      await waitFor(() => {
        expect(screen.queryByText('제목을 입력해주세요.')).not.toBeInTheDocument()
      })
    })
  })

  describe('제출 버튼 상태', () => {
    it('제목과 본문이 비어있어도 제출 버튼은 활성화된다 (유효성 검사는 제출 시)', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      expect(submitButton).toBeEnabled()
    })

    it('입력값이 있을 때도 제출 버튼이 활성화된다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      const contentTextarea = screen.getByLabelText('본문')
      
      await user.type(titleInput, 'Test Title')
      await user.type(contentTextarea, 'Test Content')

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      expect(submitButton).toBeEnabled()
    })

    it('isSubmitting이 true이면 제출 버튼이 비활성화되고 로딩 표시', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} isSubmitting={true} />)

      const submitButton = screen.getByRole('button', { name: /저장 중.../ })
      expect(submitButton).toBeDisabled()
    })

    it('isSubmitting이 true이면 취소 버튼도 비활성화된다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} isSubmitting={true} />)

      const cancelButton = screen.getByRole('button', { name: '취소' })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('폼 제출', () => {
    it('유효한 입력으로 폼을 제출하면 onSubmit이 호출된다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      const contentTextarea = screen.getByLabelText('본문')
      
      await user.type(titleInput, 'Test Title')
      await user.type(contentTextarea, 'Test Content')

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test Title', 'Test Content')
      })
    })

    it('제출 시 기본 폼 동작을 방지한다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/)
      const contentTextarea = screen.getByLabelText('본문')
      
      await user.type(titleInput, 'Test Title')
      await user.type(contentTextarea, 'Test Content')

      const form = screen.getByRole('button', { name: '노트 생성' }).closest('form')!
      const submitEvent = fireEvent.submit(form)

      expect(submitEvent).toBe(false) // preventDefault 확인
    })
  })

  describe('취소 버튼', () => {
    it('취소 버튼 클릭 시 폼이 초기화된다', async () => {
      const user = userEvent.setup()
      render(<NoteCreateForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/제목/) as HTMLInputElement
      const contentTextarea = screen.getByLabelText('본문') as HTMLTextAreaElement
      
      await user.type(titleInput, 'Test Title')
      await user.type(contentTextarea, 'Test Content')

      expect(titleInput.value).toBe('Test Title')
      expect(contentTextarea.value).toBe('Test Content')

      const cancelButton = screen.getByRole('button', { name: '취소' })
      await user.click(cancelButton)

      expect(titleInput.value).toBe('')
      expect(contentTextarea.value).toBe('')
    })
  })

  describe('템플릿 초기값', () => {
    it('initialTitle prop이 주어지면 제목 필드에 초기값이 설정된다', () => {
      render(<NoteCreateForm onSubmit={mockOnSubmit} initialTitle="회의 노트 - " />)

      const titleInput = screen.getByLabelText(/제목/) as HTMLInputElement
      expect(titleInput.value).toBe('회의 노트 - ')
    })

    it('initialContent prop이 주어지면 본문 필드에 초기값이 설정된다', () => {
      const initialContent = '## 참석자\n\n\n## 안건\n\n'
      render(
        <NoteCreateForm
          onSubmit={mockOnSubmit}
          initialContent={initialContent}
        />
      )

      const contentTextarea = screen.getByLabelText('본문') as HTMLTextAreaElement
      expect(contentTextarea.value).toBe(initialContent)
    })

    it('제목과 본문 초기값을 모두 설정할 수 있다', () => {
      const initialTitle = '회의 노트 - '
      const initialContent = '## 참석자\n\n'
      render(
        <NoteCreateForm
          onSubmit={mockOnSubmit}
          initialTitle={initialTitle}
          initialContent={initialContent}
        />
      )

      const titleInput = screen.getByLabelText(/제목/) as HTMLInputElement
      const contentTextarea = screen.getByLabelText('본문') as HTMLTextAreaElement

      expect(titleInput.value).toBe(initialTitle)
      expect(contentTextarea.value).toBe(initialContent)
    })

    it('초기값이 있어도 사용자가 수정할 수 있다', async () => {
      const user = userEvent.setup()
      const initialTitle = '회의 노트 - '
      const initialContent = '## 참석자\n\n'
      render(
        <NoteCreateForm
          onSubmit={mockOnSubmit}
          initialTitle={initialTitle}
          initialContent={initialContent}
        />
      )

      const titleInput = screen.getByLabelText(/제목/)
      const contentTextarea = screen.getByLabelText('본문')

      await user.clear(titleInput)
      await user.type(titleInput, '새 제목')

      await user.clear(contentTextarea)
      await user.type(contentTextarea, '새 본문')

      expect((titleInput as HTMLInputElement).value).toBe('새 제목')
      expect((contentTextarea as HTMLTextAreaElement).value).toBe('새 본문')
    })

    it('초기값이 있는 상태에서 제출하면 올바른 값으로 onSubmit이 호출된다', async () => {
      const user = userEvent.setup()
      const initialTitle = '회의 노트 - '
      const initialContent = '## 참석자\n\n'
      render(
        <NoteCreateForm
          onSubmit={mockOnSubmit}
          initialTitle={initialTitle}
          initialContent={initialContent}
        />
      )

      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, '2024-01-15')

      const submitButton = screen.getByRole('button', { name: '노트 생성' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          '회의 노트 - 2024-01-15',
          initialContent
        )
      })
    })
  })
})

