// Konfigurasi Jest (ESM). Sengaja memakai .mjs, bukan .ts, supaya bisa dibaca
// Jest tanpa `ts-node`. Versi .ts sebelumnya gagal di CI dengan error
// "Jest: 'ts-node' is required for the TypeScript configuration files".
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

export default createJestConfig(config)
