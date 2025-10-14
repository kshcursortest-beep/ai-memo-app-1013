// app/actions/auth.ts
// 인증 관련 Server Actions
// 회원가입, 로그인 등의 인증 작업을 서버에서 처리
// 관련 파일: lib/supabase/server.ts, app/signup/page.tsx, components/auth/SignUpForm.tsx

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 이메일/비밀번호 회원가입
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const supabase = await createClient()

    // Supabase Auth를 통한 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      // 에러 메시지 처리
      console.error('Supabase signup error:', error)
      let errorMessage = '회원가입 중 오류가 발생했습니다.'
      
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        errorMessage = '이미 가입된 이메일입니다.'
      } else if (error.message.includes('invalid email')) {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else if (error.message.includes('Password') || error.message.includes('password')) {
        errorMessage = '비밀번호가 요구사항을 충족하지 않습니다.'
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else {
        // 디버깅을 위해 실제 에러 메시지 포함
        errorMessage = `회원가입 오류: ${error.message}`
      }
      
      return { error: errorMessage }
    }

    // 회원가입 성공 시 자동 로그인됨 (Supabase가 자동으로 세션 생성)
    if (data.user) {
      // 홈 페이지 재검증
      revalidatePath('/')
      
      return { success: true, userId: data.user.id }
    }

    return { error: '회원가입에 실패했습니다.' }
  } catch (error) {
    console.error('Sign up error:', error)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = await createClient()

    // Supabase Auth를 통한 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // 에러 메시지 처리
      console.error('Supabase signin error:', error)
      let errorMessage = '로그인 중 오류가 발생했습니다.'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 완료되지 않았습니다.'
      } else if (error.message.includes('invalid email')) {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else {
        // 디버깅을 위해 실제 에러 메시지 포함
        errorMessage = `로그인 오류: ${error.message}`
      }
      
      return { error: errorMessage }
    }

    // 로그인 성공 시 세션이 자동으로 쿠키에 저장됨
    if (data.user) {
      // 홈 페이지 재검증
      revalidatePath('/')
      
      return { success: true, userId: data.user.id }
    }

    return { error: '로그인에 실패했습니다.' }
  } catch (error) {
    console.error('Sign in error:', error)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return { error: error.message }
    }

    return { user }
  } catch (error) {
    console.error('Get user error:', error)
    return { error: '사용자 정보를 가져올 수 없습니다.' }
  }
}

/**
 * 비밀번호 재설정 요청
 */
export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createClient()

    // Supabase Auth를 통한 비밀번호 재설정 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      console.error('Password reset request error:', error)
    }

    // 보안을 위해 이메일 존재 여부와 관계없이 동일한 성공 메시지 반환
    return { 
      success: true, 
      message: '비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.' 
    }
  } catch (error) {
    console.error('Password reset request error:', error)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 새 비밀번호 설정
 */
export async function updatePassword(newPassword: string) {
  try {
    const supabase = await createClient()

    // Supabase Auth를 통한 비밀번호 업데이트
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Password update error:', error)
      let errorMessage = '비밀번호 변경 중 오류가 발생했습니다.'
      
      if (error.message.includes('same as the old password') || 
          error.message.includes('should be different from the old password')) {
        errorMessage = '새 비밀번호는 이전 비밀번호와 달라야 합니다.'
      } else if (error.message.includes('Password') || error.message.includes('password')) {
        errorMessage = '비밀번호가 요구사항을 충족하지 않습니다.'
      } else {
        errorMessage = `비밀번호 변경 오류: ${error.message}`
      }
      
      return { error: errorMessage }
    }

    if (data.user) {
      revalidatePath('/')
      return { success: true, userId: data.user.id }
    }

    return { error: '비밀번호 변경에 실패했습니다.' }
  } catch (error) {
    console.error('Password update error:', error)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: '로그아웃 중 오류가 발생했습니다.' }
  }
}

