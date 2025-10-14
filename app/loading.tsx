// app/loading.tsx
// 페이지 로딩 중 스켈레톤 UI
// Next.js의 loading.tsx 규약 파일
// 관련 파일: app/page.tsx

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* 노트 카드 스켈레톤 (3x3 그리드) */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border bg-card p-6 space-y-4"
            >
              {/* 제목 스켈레톤 */}
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* 본문 스켈레톤 */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* 날짜 스켈레톤 */}
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

