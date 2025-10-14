// jest.config.mjs
// Jest 테스트 프레임워크 설정
// Next.js 환경에서 단위 테스트와 통합 테스트 실행을 위한 설정
// 관련 파일: __tests__/**/*.test.ts, __tests__/**/*.test.tsx

import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Next.js 앱의 경로
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  // 테스트 환경
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  
  // 모듈 경로 매핑 (tsconfig paths와 동일하게)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  
  // 커버리지 수집
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  // node_modules 중 변환이 필요한 패키지 예외 처리
  transformIgnorePatterns: [
    'node_modules/(?!(@google/genai)/)',
  ],
}

export default createJestConfig(config)

