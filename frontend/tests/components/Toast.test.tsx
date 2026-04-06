import React from 'react'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ToastProvider, useToast } from '../../app/components/Toast'

// Helper component that calls show() on mount
function ShowToast({ message, type }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const { show } = useToast()
  React.useEffect(() => {
    show(message, type)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

describe('ToastProvider', () => {
  it('renders children without error', () => {
    renderWithProvider(<div data-testid="child">hello</div>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('shows a success toast when show() is called', async () => {
    renderWithProvider(<ShowToast message="Upload complete" type="success" />)
    await waitFor(() => {
      expect(screen.getByText('Upload complete')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows an error toast when show() is called with error type', async () => {
    renderWithProvider(<ShowToast message="Something failed" type="error" />)
    await waitFor(() => {
      expect(screen.getByText('Something failed')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('auto-dismisses the toast after 3 seconds', async () => {
    vi.useFakeTimers()
    try {
      renderWithProvider(<ShowToast message="Bye soon" type="info" />)
      // Flush the useEffect so the toast appears
      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.getByText('Bye soon')).toBeInTheDocument()
      // Advance past the 3000ms auto-close timer
      await act(async () => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.queryByText('Bye soon')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('dismisses the toast immediately when close button is clicked', async () => {
    renderWithProvider(<ShowToast message="Click to close" type="success" />)
    await waitFor(() => {
      expect(screen.getByText('Click to close')).toBeInTheDocument()
    })
    const closeBtn = screen.getByRole('button', { name: '关闭通知' })
    fireEvent.click(closeBtn)
    expect(screen.queryByText('Click to close')).not.toBeInTheDocument()
  })
})

describe('useToast', () => {
  it('throws when used outside ToastProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function BadComponent() {
      useToast()
      return null
    }
    expect(() => render(<BadComponent />)).toThrow('useToast must be used within ToastProvider')
    spy.mockRestore()
  })
})
