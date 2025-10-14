// app/test-gemini/page.tsx
// Gemini API 테스트 페이지
// Gemini API 연동 및 동작 확인을 위한 간단한 테스트 인터페이스
// 관련 파일: lib/gemini/generateText.ts, app/actions/gemini.ts

'use client'

import { useState } from 'react'
import { testGeminiAPI } from '@/app/actions/gemini'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestGeminiPage() {
  const [prompt, setPrompt] = useState('안녕하세요! 간단한 자기소개를 해주세요.')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleTest = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await testGeminiAPI(prompt)

      if (response.success && response.text) {
        setResult(response.text)
      } else {
        setError(response.error || 'Unknown error')
      }
    } catch (err) {
      setError('Failed to call Gemini API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🤖 Gemini API 테스트</CardTitle>
          <CardDescription>
            Google Gemini API 연동이 올바르게 동작하는지 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 프롬프트 입력 */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              프롬프트 입력
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Gemini에게 질문하거나 요청할 내용을 입력하세요..."
              rows={4}
              className="w-full"
            />
          </div>

          {/* 테스트 버튼 */}
          <Button
            onClick={handleTest}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? '처리 중...' : 'Gemini API 테스트'}
          </Button>

          {/* 에러 표시 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">❌ 에러</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              {error.includes('GEMINI_API_KEY') && (
                <div className="mt-2 text-xs text-red-600">
                  <p>💡 해결 방법:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google AI Studio
                      </a>
                      에서 API 키 발급
                    </li>
                    <li>.env.local 파일에 GEMINI_API_KEY 추가</li>
                    <li>개발 서버 재시작</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* 결과 표시 */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">
                ✅ Gemini 응답
              </p>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}

          {/* API 정보 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-2">📋 API 정보</p>
            <ul className="space-y-1 text-xs">
              <li>• 모델: gemini-2.0-flash-001</li>
              <li>• 최대 출력 토큰: 8,192</li>
              <li>• 타임아웃: 10초</li>
              <li>• Temperature: 0.7</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 샘플 프롬프트 */}
      <Card>
        <CardHeader>
          <CardTitle>💡 샘플 프롬프트</CardTitle>
          <CardDescription>
            아래 샘플 프롬프트를 클릭하여 테스트해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              '간단한 자기소개를 해주세요.',
              '인공지능의 미래에 대해 3가지 핵심 트렌드를 설명해주세요.',
              '다음 문장을 3가지 방법으로 요약해주세요: "TypeScript는 JavaScript에 타입 시스템을 추가한 프로그래밍 언어입니다."',
              '건강한 아침 식사 메뉴 3가지를 추천해주세요.',
              '효과적인 공부 방법 5가지를 알려주세요.',
            ].map((sample, index) => (
              <button
                key={index}
                onClick={() => setPrompt(sample)}
                className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                {sample}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

