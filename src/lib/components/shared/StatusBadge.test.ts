import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge.svelte'

describe('StatusBadge', () => {
  it('should render with status text', () => {
    render(StatusBadge, { props: { status: 'pending' } })
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('should display custom label when provided', () => {
    render(StatusBadge, { props: { status: 'under_review', label: 'In Review' } })
    expect(screen.getByText('In Review')).toBeInTheDocument()
  })

  it('should replace underscores with spaces in status', () => {
    render(StatusBadge, { props: { status: 'under_review' } })
    expect(screen.getByText('under review')).toBeInTheDocument()
  })

  it('should apply size classes for sm', () => {
    const { container } = render(StatusBadge, { props: { status: 'active', size: 'sm' } })
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-xs')
  })

  it('should apply size classes for lg', () => {
    const { container } = render(StatusBadge, { props: { status: 'active', size: 'lg' } })
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-sm')
  })

  it('should apply green classes for accepted status', () => {
    const { container } = render(StatusBadge, { props: { status: 'accepted' } })
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('green')
  })

  it('should apply red classes for rejected status', () => {
    const { container } = render(StatusBadge, { props: { status: 'rejected' } })
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('red')
  })

  it('should apply yellow classes for pending status', () => {
    const { container } = render(StatusBadge, { props: { status: 'pending' } })
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('yellow')
  })

  it('should apply custom class', () => {
    const { container } = render(StatusBadge, {
      props: { status: 'active', class: 'my-custom-class' }
    })
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('my-custom-class')
  })
})
