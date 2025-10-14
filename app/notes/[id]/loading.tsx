// app/notes/[id]/loading.tsx
// 노트 상세 페이지 로딩 스켈레톤 UI
// 제목, 날짜, 본문 영역 스켈레톤 표시
// 관련 파일: app/notes/[id]/page.tsx

export default function NoteDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 스켈레톤 */}
        <div className="mb-6">
          <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
        </div>

        {/* 노트 상세 스켈레톤 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* 제목 스켈레톤 */}
          <div className="mb-6">
            <div className="h-9 bg-gray-200 rounded-md mb-4 animate-pulse w-3/4" />
            
            {/* 날짜 스켈레톤 */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded-md animate-pulse w-48" />
              <div className="h-5 bg-gray-200 rounded-md animate-pulse w-48" />
            </div>
          </div>

          {/* 본문 스켈레톤 */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-4/5" />
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}

