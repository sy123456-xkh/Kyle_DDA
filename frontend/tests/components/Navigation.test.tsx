import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Navigation from '../../app/components/Navigation'

// Mock next/link since we're not in a Next.js router context
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode; href: string }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('Navigation', () => {
  it('renders the brand name', () => {
    render(<Navigation />)
    expect(screen.getByText('Kyle Studios')).toBeInTheDocument()
  })

  it('renders the three nav links', () => {
    render(<Navigation />)
    expect(screen.getByText('Landing')).toBeInTheDocument()
    expect(screen.getByText('Data Hub')).toBeInTheDocument()
    expect(screen.getByText('Copilot')).toBeInTheDocument()
  })

  it('highlights the active page with amber styling', () => {
    render(<Navigation activePage="data-hub" />)
    const dataHubLink = screen.getByText('Data Hub')
    expect(dataHubLink.className).toContain('text-amber-600')
  })

  it('defaults active page to landing', () => {
    render(<Navigation />)
    const landingLink = screen.getByText('Landing')
    expect(landingLink.className).toContain('text-amber-600')
  })

  it('renders Get Started button', () => {
    render(<Navigation />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('Get Started links to /copilot when hasDataset is true', () => {
    render(<Navigation hasDataset={true} />)
    const link = screen.getByText('Get Started').closest('a')
    expect(link).toHaveAttribute('href', '/copilot')
  })

  it('Get Started links to # when hasDataset is false', () => {
    render(<Navigation hasDataset={false} />)
    const link = screen.getByText('Get Started').closest('a')
    expect(link).toHaveAttribute('href', '#')
  })

  it('applies disabled styling when hasDataset is false', () => {
    render(<Navigation hasDataset={false} />)
    const link = screen.getByText('Get Started').closest('a')
    expect(link?.className).toContain('cursor-not-allowed')
  })
})
