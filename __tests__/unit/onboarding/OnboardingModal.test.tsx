// __tests__/unit/onboarding/OnboardingModal.test.tsx
// 온보딩 모달 컴포넌트 단위 테스트
// 렌더링, 단계 이동, 완료/건너뛰기 테스트
// 관련 파일: components/onboarding/OnboardingModal.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

// useRouter 모킹
const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// sonner toast 모킹
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('OnboardingModal Component', () => {
  const mockOnComplete = jest.fn()
  const mockOnSkip = jest.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
    mockOnSkip.mockClear()
    mockPush.mockClear()
    mockRefresh.mockClear()
  })

  it('첫 번째 단계를 렌더링한다', () => {
    render(
      <OnboardingModal
        open={true}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    )

    expect(screen.getByText(/AI 메모장에 오신 것을 환영합니다!/)).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('다음 버튼 클릭 시 두 번째 단계로 이동한다', async () => {
    const user = userEvent.setup()
    render(
      <OnboardingModal
        open={true}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    )

    const nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/텍스트와 음성으로 메모하세요/)).toBeInTheDocument()
    })
  })

  it('건너뛰기 버튼 클릭 시 onSkip을 호출한다', async () => {
    const user = userEvent.setup()
    mockOnSkip.mockResolvedValue({ success: true })

    render(
      <OnboardingModal
        open={true}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    )

    const skipButton = screen.getByRole('button', { name: /건너뛰기/ })
    await user.click(skipButton)

    await waitFor(() => {
      expect(mockOnSkip).toHaveBeenCalled()
    })
  })

  it('마지막 단계에서 시작하기 버튼을 표시한다', async () => {
    const user = userEvent.setup()
    render(
      <OnboardingModal
        open={true}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    )

    // 세 번째 단계로 이동
    const nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /시작하기/ })).toBeInTheDocument()
    })
  })

  it('시작하기 버튼 클릭 시 onComplete를 호출한다', async () => {
    const user = userEvent.setup()
    mockOnComplete.mockResolvedValue({ success: true })

    render(
      <OnboardingModal
        open={true}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    )

    // 세 번째 단계로 이동
    const nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    await user.click(nextButton)

    // 시작하기 클릭
    const startButton = screen.getByRole('button', { name: /시작하기/ })
    await user.click(startButton)

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })
})


