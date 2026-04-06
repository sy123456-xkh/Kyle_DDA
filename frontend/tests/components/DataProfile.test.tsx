import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DataProfile from '../../app/components/DataProfile'

const mockData = {
  row_count: 1234,
  columns: [
    { name: 'id', type: 'INTEGER' },
    { name: 'name', type: 'VARCHAR' },
    { name: 'age', type: 'INTEGER' },
  ],
  missing_rate: [
    { name: 'id', missing_rate: 0 },
    { name: 'name', missing_rate: 0.1 },
    { name: 'age', missing_rate: 0.2 },
  ],
}

describe('DataProfile', () => {
  it('renders nothing when data is null', () => {
    const { container } = render(<DataProfile data={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the section heading', () => {
    render(<DataProfile data={mockData} />)
    expect(screen.getByText('Data Profile')).toBeInTheDocument()
  })

  it('displays the row count formatted with toLocaleString', () => {
    render(<DataProfile data={mockData} />)
    // 1234 → "1,234" in en-US locales
    expect(screen.getByText(mockData.row_count.toLocaleString())).toBeInTheDocument()
  })

  it('displays the correct column count', () => {
    render(<DataProfile data={mockData} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calculates and displays completeness percentage', () => {
    // average missing_rate = (0 + 0.1 + 0.2) / 3 = 0.1 → completeness = 90%
    render(<DataProfile data={mockData} />)
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('shows 100% completeness when missing_rate array is empty', () => {
    const data = { ...mockData, missing_rate: [] }
    render(<DataProfile data={data} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('renders all three stat cards', () => {
    render(<DataProfile data={mockData} />)
    expect(screen.getByText('DATASET SIZE')).toBeInTheDocument()
    expect(screen.getByText('SCHEMA WIDTH')).toBeInTheDocument()
    expect(screen.getByText('QUALITY SCORE')).toBeInTheDocument()
  })
})
