// lib/utils/dateFormat.ts
// 날짜 포맷팅 유틸리티
// 상대 시간 (최근 7일) 또는 절대 시간 (7일 이후) 표시
// 관련 파일: components/notes/NoteCard.tsx

/**
 * 상대 시간 또는 절대 시간으로 날짜 포맷팅
 * - 최근 7일: "방금 전", "5분 전", "2시간 전", "3일 전"
 * - 7일 이후: "2025-10-14"
 */
export function formatDate(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  // 최근 7일 이내: 상대 시간
  if (diffInDays < 7) {
    if (diffInSeconds < 60) {
      return '방금 전'
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    }
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`
    }
    return `${diffInDays}일 전`
  }

  // 7일 이후: 절대 시간 (YYYY-MM-DD)
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 본문 텍스트를 지정된 길이로 자르고 말줄임표 추가
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

