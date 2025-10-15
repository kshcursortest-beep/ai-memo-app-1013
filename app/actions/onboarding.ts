// app/actions/onboarding.ts
// 온보딩 관련 Server Actions
// 온보딩 상태 조회 및 저장
// 관련 파일: components/onboarding/OnboardingModal.tsx, app/actions/user.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 현재 사용자의 온보딩 완료 여부 확인
 */
export async function getOnboardingStatus() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { hasCompletedOnboarding: false, error: '사용자 정보를 가져올 수 없습니다.' }
    }

    // user_metadata에서 온보딩 완료 여부 확인
    const hasCompletedOnboarding = user.user_metadata?.has_completed_onboarding === true

    return { hasCompletedOnboarding, userId: user.id }
  } catch (error) {
    console.error('Get onboarding status error:', error)
    return { hasCompletedOnboarding: false, error: '온보딩 상태를 확인할 수 없습니다.' }
  }
}

/**
 * 온보딩 완료 상태 저장
 */
export async function completeOnboarding() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: '사용자 정보를 가져올 수 없습니다.' }
    }

    // user_metadata에 온보딩 완료 상태 저장
    const { error } = await supabase.auth.updateUser({
      data: {
        has_completed_onboarding: true,
      },
    })

    if (error) {
      console.error('Complete onboarding error:', error)
      return { error: '온보딩 완료 처리 중 오류가 발생했습니다.' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

/**
 * 온보딩 재시작 (온보딩 다시 보기)
 */
export async function resetOnboarding() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: '사용자 정보를 가져올 수 없습니다.' }
    }

    // user_metadata에서 온보딩 완료 상태 제거
    const { error } = await supabase.auth.updateUser({
      data: {
        has_completed_onboarding: false,
      },
    })

    if (error) {
      console.error('Reset onboarding error:', error)
      return { error: '온보딩 재시작 중 오류가 발생했습니다.' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Reset onboarding error:', error)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}



