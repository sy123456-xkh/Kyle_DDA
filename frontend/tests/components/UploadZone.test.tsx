import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UploadZone from '../../app/components/UploadZone'

describe('UploadZone', () => {
  it('renders idle state with heading and browse button', () => {
    render(<UploadZone onUpload={vi.fn()} />)
    expect(screen.getByText('上传 CSV 数据文件')).toBeInTheDocument()
    expect(screen.getByText('Browse Local Files')).toBeInTheDocument()
  })

  it('renders file size limit note', () => {
    render(<UploadZone onUpload={vi.fn()} />)
    expect(screen.getByText(/MAX FILE SIZE 50MB/)).toBeInTheDocument()
  })

  it('renders a file input accepting .csv', () => {
    const { container } = render(<UploadZone onUpload={vi.fn()} />)
    const input = container.querySelector('input[type="file"]')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', '.csv')
  })

  it('calls onUpload when a valid CSV file is selected', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<UploadZone onUpload={onUpload} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file)
    })
  })

  it('does NOT call onUpload for non-CSV files', () => {
    const onUpload = vi.fn()
    const { container } = render(<UploadZone onUpload={onUpload} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['data'], 'data.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onUpload).not.toHaveBeenCalled()
  })

  it('calls onSizeError for files exceeding 50MB', async () => {
    const onUpload = vi.fn()
    const onSizeError = vi.fn()
    const { container } = render(<UploadZone onUpload={onUpload} onSizeError={onSizeError} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    // Create a fake oversized file
    const oversizedFile = new File(['x'], 'big.csv', { type: 'text/csv' })
    Object.defineProperty(oversizedFile, 'size', { value: 51 * 1024 * 1024 })

    fireEvent.change(input, { target: { files: [oversizedFile] } })

    await waitFor(() => {
      expect(onSizeError).toHaveBeenCalledWith(expect.stringContaining('文件过大'))
    })
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows uploading state while onUpload is in progress', async () => {
    let resolve: () => void
    const onUpload = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res
        }),
    )
    const { container } = render(<UploadZone onUpload={onUpload} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['a,b'], 'test.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('上传中...')).toBeInTheDocument()
    })

    // Clean up: resolve the promise
    await act(async () => {
      resolve()
    })
  })

  it('shows dragging state on dragOver', () => {
    render(<UploadZone onUpload={vi.fn()} />)
    const dropZone = screen.getByText('上传 CSV 数据文件').closest('div')?.parentElement
      ?.parentElement as HTMLElement

    fireEvent.dragOver(dropZone, { preventDefault: () => {} })
    expect(screen.getByText('松开以上传')).toBeInTheDocument()
  })

  it('reverts to idle state on dragLeave', () => {
    render(<UploadZone onUpload={vi.fn()} />)
    const dropZone = screen.getByText('上传 CSV 数据文件').closest('div')?.parentElement
      ?.parentElement as HTMLElement

    fireEvent.dragOver(dropZone, { preventDefault: () => {} })
    expect(screen.getByText('松开以上传')).toBeInTheDocument()

    fireEvent.dragLeave(dropZone)
    expect(screen.getByText('上传 CSV 数据文件')).toBeInTheDocument()
  })
})
