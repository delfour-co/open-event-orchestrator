import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import Pagination from './Pagination.svelte'

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    perPage: 10,
    onPageChange: vi.fn()
  }

  it('should render page numbers', () => {
    render(Pagination, { props: defaultProps })
    // Use getAllByText since page numbers appear in both info and buttons
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('10').length).toBeGreaterThan(0)
  })

  it('should show current page as active', () => {
    render(Pagination, { props: { ...defaultProps, currentPage: 5 } })
    const button = screen.getByText('5')
    expect(button.getAttribute('aria-current')).toBe('page')
  })

  it('should show item count info', () => {
    render(Pagination, { props: defaultProps })
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    expect(screen.getByText(/results/)).toBeInTheDocument()
  })

  it('should hide info when showInfo is false', () => {
    render(Pagination, { props: { ...defaultProps, showInfo: false } })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('should call onPageChange when clicking a page', async () => {
    const onPageChange = vi.fn()
    render(Pagination, { props: { ...defaultProps, onPageChange } })

    await fireEvent.click(screen.getByText('2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('should call onPageChange when clicking next', async () => {
    const onPageChange = vi.fn()
    render(Pagination, { props: { ...defaultProps, onPageChange } })

    const nextButton = screen.getByLabelText('Next page')
    await fireEvent.click(nextButton)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('should call onPageChange when clicking previous', async () => {
    const onPageChange = vi.fn()
    render(Pagination, { props: { ...defaultProps, currentPage: 5, onPageChange } })

    const prevButton = screen.getByLabelText('Previous page')
    await fireEvent.click(prevButton)
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('should disable previous button on first page', () => {
    render(Pagination, { props: { ...defaultProps, currentPage: 1 } })
    const prevButton = screen.getByLabelText('Previous page')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(Pagination, { props: { ...defaultProps, currentPage: 10 } })
    const nextButton = screen.getByLabelText('Next page')
    expect(nextButton).toBeDisabled()
  })

  it('should show ellipsis for many pages', () => {
    render(Pagination, { props: { ...defaultProps, currentPage: 5, totalPages: 20 } })
    expect(screen.getAllByText('...')).toHaveLength(2)
  })

  it('should have navigation role', () => {
    render(Pagination, { props: defaultProps })
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should have aria-label for pagination', () => {
    render(Pagination, { props: defaultProps })
    expect(screen.getByLabelText('Pagination')).toBeInTheDocument()
  })
})
