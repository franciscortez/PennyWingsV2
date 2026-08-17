import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'

// Provide fallback environment variables for Supabase client
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key'

// Start MSW server before running tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Reset handlers and clean DOM after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up server after all tests
afterAll(() => server.close())

// Mock window.matchMedia for responsive/theme hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
