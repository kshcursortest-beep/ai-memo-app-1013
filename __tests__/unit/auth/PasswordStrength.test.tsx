// __tests__/unit/auth/PasswordStrength.test.tsx
// 비밀번호 강도 표시기 컴포넌트 단위 테스트
// 비밀번호 강도 시각화 및 텍스트 표시 테스트
// 관련 파일: components/auth/PasswordStrength.tsx

import { render, screen } from '@testing-library/react'
import { PasswordStrength } from '@/components/auth/PasswordStrength'

describe('PasswordStrength Component', () => {
  it('비밀번호가 비어있으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('약한 비밀번호는 "약함" 텍스트를 표시한다', () => {
    render(<PasswordStrength password="12345678" />)
    expect(screen.getByText('약함')).toBeInTheDocument()
  })

  it('중간 강도 비밀번호는 "보통" 텍스트를 표시한다', () => {
    render(<PasswordStrength password="Password123" />)
    expect(screen.getByText('보통')).toBeInTheDocument()
  })

  it('강한 비밀번호는 "강함" 텍스트를 표시한다', () => {
    render(<PasswordStrength password="StrongPass123!" />)
    expect(screen.getByText('강함')).toBeInTheDocument()
  })

  it('약한 비밀번호에 대한 도움말을 표시한다', () => {
    render(<PasswordStrength password="weak" />)
    expect(screen.getByText(/더 안전한 비밀번호를 위해/)).toBeInTheDocument()
  })

  it('강한 비밀번호에는 도움말을 표시하지 않는다', () => {
    render(<PasswordStrength password="StrongPass123!" />)
    expect(screen.queryByText(/더 안전한 비밀번호를 위해/)).not.toBeInTheDocument()
  })
})

