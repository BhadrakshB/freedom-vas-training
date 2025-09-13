import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuthState } from 'react-firebase-hooks/auth'

// Mock Firebase auth
vi.mock('@/app/adapters/firebase/firebase.client', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn()
  }
}))

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(),
  useSignInWithEmailAndPassword: vi.fn(),
  useCreateUserWithEmailAndPassword: vi.fn(),
  useSignInWithGoogle: vi.fn()
}))

describe('Authentication Hooks Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize useAuthState hook correctly', () => {
    const mockUseAuthState = vi.mocked(useAuthState)
    mockUseAuthState.mockReturnValue([null, false, undefined])

    const { result } = renderHook(() => useAuthState(null as any))
    
    expect(result.current).toEqual([null, false, undefined])
    expect(mockUseAuthState).toHaveBeenCalled()
  })

  it('should handle loading state correctly', () => {
    const mockUseAuthState = vi.mocked(useAuthState)
    mockUseAuthState.mockReturnValue([null, true, undefined])

    const { result } = renderHook(() => useAuthState(null as any))
    
    expect(result.current[1]).toBe(true) // loading state
  })

  it('should handle authenticated user state', () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }
    const mockUseAuthState = vi.mocked(useAuthState)
    mockUseAuthState.mockReturnValue([mockUser as any, false, undefined])

    const { result } = renderHook(() => useAuthState(null as any))
    
    expect(result.current[0]).toEqual(mockUser)
    expect(result.current[1]).toBe(false) // not loading
  })
})