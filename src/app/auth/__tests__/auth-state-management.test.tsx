import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthPage from '../page'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}))

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

// Mock UI components
vi.mock('@/app/components/ui', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h1 data-testid="card-title">{children}</h1>
}))

describe('AuthPage State Management', () => {
  const mockPush = vi.fn()
  
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    const mockRouter = { push: mockPush }
    const mockSearchParams = { get: vi.fn().mockReturnValue(null) }
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any)
    
    // Import and mock the hooks
    const hooks = await import('react-firebase-hooks/auth')
    
    // Default mock for useAuthState - not authenticated, not loading
    vi.mocked(hooks.useAuthState).mockReturnValue([null, false, undefined])
    
    // Default mocks for auth functions
    vi.mocked(hooks.useSignInWithEmailAndPassword).mockReturnValue([vi.fn(), null, false, undefined])
    vi.mocked(hooks.useCreateUserWithEmailAndPassword).mockReturnValue([vi.fn(), null, false, undefined])
    vi.mocked(hooks.useSignInWithGoogle).mockReturnValue([vi.fn(), null, false, undefined])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render loading spinner when authentication state is loading', async () => {
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useAuthState).mockReturnValue([null, true, undefined])

    render(<AuthPage />)
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
    expect(screen.getByText('Checking authentication status...')).toBeTruthy()
  })

  it('should redirect authenticated users', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useAuthState).mockReturnValue([mockUser as any, false, undefined])

    render(<AuthPage />)
    
    // First check that the redirecting state is shown
    expect(screen.getByText('Redirecting to dashboard...')).toBeTruthy()
    
    // Advance timers to trigger the redirect
    act(() => {
      vi.advanceTimersByTime(200)
    })
    
    // Check that redirect was called
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should render auth form for unauthenticated users', () => {
    render(<AuthPage />)
    
    expect(screen.getByTestId('card')).toBeTruthy()
    expect(screen.getByTestId('card-title')).toBeTruthy()
    expect(screen.getByText('Welcome to AI Training Simulator')).toBeTruthy()
  })

  it('should display form elements for unauthenticated users', () => {
    render(<AuthPage />)
    
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeTruthy()
  })

  it('should show loading overlay when authentication is in progress', async () => {
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useSignInWithEmailAndPassword).mockReturnValue([vi.fn(), null, true, undefined])

    render(<AuthPage />)
    
    // Check for the overlay specifically
    const overlay = document.querySelector('.backdrop-blur-sm')
    expect(overlay).toBeTruthy()
    
    // Check that all elements are disabled during loading
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    expect(emailInput).toHaveAttribute('disabled')
    expect(passwordInput).toHaveAttribute('disabled')
  })

  it('should display error messages when authentication fails', async () => {
    const mockError = { code: 'auth/invalid-credential', message: 'Authentication failed' }
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useSignInWithEmailAndPassword).mockReturnValue([vi.fn(), null, false, mockError])

    render(<AuthPage />)
    
    expect(screen.getByText('Invalid email or password')).toBeTruthy()
  })

  it('should display comprehensive error messages for different Firebase error codes', async () => {
    const testCases = [
      { code: 'auth/email-already-in-use', expected: 'An account with this email already exists' },
      { code: 'auth/weak-password', expected: 'Password should be at least 6 characters' },
      { code: 'auth/network-request-failed', expected: 'Network error. Please check your connection and try again' },
      { code: 'auth/too-many-requests', expected: 'Too many failed attempts. Please try again later' },
      { code: 'auth/popup-blocked', expected: 'Please allow popups and try again' },
      { code: 'auth/unknown-error', expected: 'An unexpected error occurred. Please try again' }
    ]

    const hooks = await import('react-firebase-hooks/auth')

    for (const testCase of testCases) {
      vi.clearAllMocks()
      const mockError = { code: testCase.code, message: 'Test error' }
      vi.mocked(hooks.useSignInWithEmailAndPassword).mockReturnValue([vi.fn(), null, false, mockError])
      vi.mocked(hooks.useAuthState).mockReturnValue([null, false, undefined])
      vi.mocked(hooks.useCreateUserWithEmailAndPassword).mockReturnValue([vi.fn(), null, false, undefined])
      vi.mocked(hooks.useSignInWithGoogle).mockReturnValue([vi.fn(), null, false, undefined])

      const { unmount } = render(<AuthPage />)
      
      expect(screen.getByText(testCase.expected)).toBeTruthy()
      unmount()
    }
  })

  it('should show retry button for service errors', async () => {
    const mockError = { code: 'auth/network-request-failed', message: 'Network error' }
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useSignInWithEmailAndPassword).mockReturnValue([vi.fn(), null, false, mockError])

    render(<AuthPage />)
    
    expect(screen.getByText('Network error. Please check your connection and try again')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
  })

  it('should redirect to custom URL from search params', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }
    const mockSearchParams = { get: vi.fn().mockReturnValue('/custom-page') }
    
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any)
    
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useAuthState).mockReturnValue([mockUser as any, false, undefined])

    render(<AuthPage />)
    
    // Check that the redirecting state shows generic message for custom redirect
    expect(screen.getByText('Redirecting...')).toBeTruthy()
    
    // Advance timers to trigger the redirect
    act(() => {
      vi.advanceTimersByTime(200)
    })
    
    // Check that redirect was called with custom URL
    expect(mockPush).toHaveBeenCalledWith('/custom-page')
  })

  it('should prevent open redirect attacks', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }
    const mockSearchParams = { get: vi.fn().mockReturnValue('//malicious-site.com') }
    
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any)
    
    const hooks = await import('react-firebase-hooks/auth')
    vi.mocked(hooks.useAuthState).mockReturnValue([mockUser as any, false, undefined])

    render(<AuthPage />)
    
    // Advance timers to trigger the redirect
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    
    // Should redirect to safe default instead of malicious URL
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})