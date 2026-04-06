import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChartView, { COLOR_THEMES } from '../../app/components/ChartView'

// Mock echarts to avoid canvas rendering in jsdom
vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  })),
}))

const baseSpec = {
  type: 'line' as const,
  title: 'Test Chart',
  x: 'month',
  y: 'revenue',
  series: null,
  data: [
    { month: 'Jan', revenue: 100 },
    { month: 'Feb', revenue: 200 },
  ],
}

describe('COLOR_THEMES', () => {
  it('exports 4 color themes', () => {
    expect(Object.keys(COLOR_THEMES)).toHaveLength(4)
  })

  it('each theme has at least 5 colors', () => {
    for (const colors of Object.values(COLOR_THEMES)) {
      expect(colors.length).toBeGreaterThanOrEqual(5)
    }
  })

  it('indigo theme starts with the expected color', () => {
    expect(COLOR_THEMES.indigo[0]).toBe('#6366f1')
  })

  it('amber theme starts with the expected color', () => {
    expect(COLOR_THEMES.amber[0]).toBe('#f59e0b')
  })
})

describe('ChartView', () => {
  it('returns null for table type (no canvas rendered)', () => {
    const spec = { ...baseSpec, type: 'table' as const }
    const { container } = render(<ChartView spec={spec} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when data is empty', () => {
    const spec = { ...baseSpec, data: [] }
    const { container } = render(<ChartView spec={spec} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a chart container div for line charts with data', () => {
    const { container } = render(<ChartView spec={baseSpec} />)
    const div = container.querySelector('div')
    expect(div).toBeInTheDocument()
    expect(div).toHaveStyle({ width: '100%', height: '260px' })
  })

  it('accepts a custom className', () => {
    const { container } = render(<ChartView spec={baseSpec} className="my-custom-class" />)
    const div = container.querySelector('div')
    expect(div?.className).toContain('my-custom-class')
  })

  it('renders bar chart container', () => {
    const spec = { ...baseSpec, type: 'bar' as const }
    const { container } = render(<ChartView spec={spec} />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('renders pie chart container', () => {
    const spec = { ...baseSpec, type: 'pie' as const }
    const { container } = render(<ChartView spec={spec} />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })
})
