// components/ui/error-boundary.tsx
// React 에러 바운더리 컴포넌트
// 예상치 못한 JavaScript 에러를 캐치하고 복구 UI 제공
// 관련 파일: lib/utils/errorClassifier.ts, app/actions/error-reporting.ts

'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { classifyError } from '@/lib/utils/errorClassifier'
import { reportError } from '@/app/actions/error-reporting'
import type { AIError } from '@/lib/types/ai'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  reported: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * React 에러 바운더리 컴포넌트
 * JavaScript 에러를 캐치하고 사용자에게 친화적인 에러 UI 제공
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reported: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 에러 리포팅
    this.reportError(error, errorInfo)

    // 부모 컴포넌트에 에러 전달
    this.props.onError?.(error, errorInfo)
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.reported) return

    try {
      await reportError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })

      this.setState({ reported: true })
    } catch (reportingError) {
      console.error('에러 리포팅 실패:', reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reported: false,
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg text-gray-900">
                예상치 못한 오류가 발생했습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                죄송합니다. 페이지를 로드하는 중에 문제가 발생했습니다.
                <br />
                아래 버튼을 클릭하여 다시 시도하거나 홈으로 돌아가세요.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    개발자 정보
                  </summary>
                  <div className="mt-2 rounded bg-gray-100 p-3 text-xs">
                    <p className="font-medium">에러 메시지:</p>
                    <p className="mb-2 break-words">{this.state.error.message}</p>
                    <p className="font-medium">스택 트레이스:</p>
                    <pre className="whitespace-pre-wrap break-words">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  홈으로 돌아가기
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                문제가 지속되면 관리자에게 문의해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 에러 바운더리 훅 (함수형 컴포넌트용)
 * @param error - 에러 객체
 * @param resetError - 에러 상태 리셋 함수
 */
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('에러 발생:', error, errorInfo)
    
    // 에러 리포팅
    reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }).catch(reportingError => {
      console.error('에러 리포팅 실패:', reportingError)
    })
  }, [])

  return { handleError }
}
