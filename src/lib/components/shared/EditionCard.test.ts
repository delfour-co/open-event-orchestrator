import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import EditionCard from './EditionCard.svelte'

describe('EditionCard', () => {
  const defaultEdition = {
    id: '1',
    name: 'DevFest 2024',
    slug: 'devfest-2024',
    year: 2024,
    status: 'published'
  }

  it('should render edition name', () => {
    render(EditionCard, { props: { edition: defaultEdition } })
    expect(screen.getByText('DevFest 2024')).toBeInTheDocument()
  })

  it('should render year when no dates provided', () => {
    render(EditionCard, { props: { edition: defaultEdition } })
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('should render date range when dates provided', () => {
    const edition = {
      ...defaultEdition,
      startDate: '2024-06-15',
      endDate: '2024-06-17'
    }
    const { container } = render(EditionCard, { props: { edition } })
    // Check that some date text is displayed (locale-independent)
    const dateText = container.querySelector('.text-muted-foreground')
    expect(dateText).toBeInTheDocument()
    expect(dateText?.textContent).toContain('-')
  })

  it('should render status badge', () => {
    render(EditionCard, { props: { edition: defaultEdition } })
    expect(screen.getByText('published')).toBeInTheDocument()
  })

  it('should render as link when href provided', () => {
    render(EditionCard, {
      props: { edition: defaultEdition, href: '/admin/editions/devfest-2024' }
    })
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/editions/devfest-2024')
  })

  it('should render as div when no href provided', () => {
    render(EditionCard, { props: { edition: defaultEdition } })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should apply selected styling when selected', () => {
    const { container } = render(EditionCard, {
      props: { edition: defaultEdition, selected: true }
    })
    const card = container.querySelector('div') || container.querySelector('a')
    expect(card?.className).toContain('border-primary')
  })

  it('should not apply selected styling when not selected', () => {
    const { container } = render(EditionCard, {
      props: { edition: defaultEdition, selected: false }
    })
    const card = container.querySelector('div')
    expect(card?.className).not.toContain('ring-2')
  })

  it('should apply custom class', () => {
    const { container } = render(EditionCard, {
      props: { edition: defaultEdition, class: 'my-card-class' }
    })
    const card = container.querySelector('div')
    expect(card?.className).toContain('my-card-class')
  })

  it('should have hover effect when link', () => {
    const { container } = render(EditionCard, {
      props: { edition: defaultEdition, href: '/test' }
    })
    const link = container.querySelector('a')
    expect(link?.className).toContain('hover:border-primary')
  })

  it('should render draft status', () => {
    const edition = { ...defaultEdition, status: 'draft' }
    render(EditionCard, { props: { edition } })
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('should render archived status', () => {
    const edition = { ...defaultEdition, status: 'archived' }
    render(EditionCard, { props: { edition } })
    expect(screen.getByText('archived')).toBeInTheDocument()
  })
})
