import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkeletonLine, SkeletonCard, SkeletonTable } from '../../app/components/Skeleton'

describe('SkeletonLine', () => {
  it('renders without error', () => {
    render(<SkeletonLine />)
    // role="status" is on the element
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has animate-pulse class', () => {
    render(<SkeletonLine />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('animate-pulse')
  })

  it('defaults to width 100%', () => {
    render(<SkeletonLine />)
    const el = screen.getByRole('status')
    expect(el).toHaveStyle({ width: '100%' })
  })

  it('accepts a custom width prop', () => {
    render(<SkeletonLine width="50%" />)
    const el = screen.getByRole('status')
    expect(el).toHaveStyle({ width: '50%' })
  })

  it('defaults to height 16px', () => {
    render(<SkeletonLine />)
    const el = screen.getByRole('status')
    expect(el).toHaveStyle({ height: '16px' })
  })

  it('accepts a custom height prop', () => {
    render(<SkeletonLine height="32px" />)
    const el = screen.getByRole('status')
    expect(el).toHaveStyle({ height: '32px' })
  })

  it('has aria-label 加载中', () => {
    render(<SkeletonLine />)
    expect(screen.getByLabelText('加载中')).toBeInTheDocument()
  })
})

describe('SkeletonCard', () => {
  it('renders without error', () => {
    render(<SkeletonCard />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has animate-pulse class on child cards', () => {
    const { container } = render(<SkeletonCard />)
    // The 3 inner card divs all have animate-pulse
    const pulsing = container.querySelectorAll('.animate-pulse')
    expect(pulsing.length).toBeGreaterThanOrEqual(3)
  })

  it('renders exactly 3 placeholder card blocks', () => {
    const { container } = render(<SkeletonCard />)
    // The grid has 3 direct children (one per card)
    const grid = container.querySelector('.grid')
    expect(grid?.children.length).toBe(3)
  })

  it('has aria-label 加载中', () => {
    render(<SkeletonCard />)
    expect(screen.getByLabelText('加载中')).toBeInTheDocument()
  })
})

describe('SkeletonTable', () => {
  it('renders without error', () => {
    render(<SkeletonTable />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has animate-pulse on placeholder elements', () => {
    const { container } = render(<SkeletonTable />)
    const pulsing = container.querySelectorAll('.animate-pulse')
    // header: 4 cells, data: 5 rows × 4 cols = 20 → 24 total
    expect(pulsing.length).toBeGreaterThanOrEqual(4)
  })

  it('renders a header row with 4 column placeholders', () => {
    const { container } = render(<SkeletonTable />)
    // The first child of .space-y-3 is the header flex row
    const wrapper = container.querySelector('.space-y-3')
    const headerRow = wrapper?.children[0]
    expect(headerRow?.children.length).toBe(4)
  })

  it('renders 5 data rows after the header', () => {
    const { container } = render(<SkeletonTable />)
    const wrapper = container.querySelector('.space-y-3')
    // children[0] = header, children[1..5] = data rows
    expect(wrapper?.children.length).toBe(6) // 1 header + 5 data rows
  })

  it('has aria-label 加载中', () => {
    render(<SkeletonTable />)
    expect(screen.getByLabelText('加载中')).toBeInTheDocument()
  })
})
