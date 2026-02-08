import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import PageHeader from './PageHeader.svelte'

describe('PageHeader', () => {
  it('should render title as h1', () => {
    render(PageHeader, { props: { title: 'Dashboard' } })
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Dashboard')
  })

  it('should render description when provided', () => {
    render(PageHeader, {
      props: {
        title: 'Settings',
        description: 'Manage your preferences'
      }
    })
    expect(screen.getByText('Manage your preferences')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    const { container } = render(PageHeader, { props: { title: 'Settings' } })
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(0)
  })

  it('should apply custom class', () => {
    const { container } = render(PageHeader, {
      props: { title: 'Test', class: 'my-header-class' }
    })
    const div = container.querySelector('div')
    expect(div?.className).toContain('my-header-class')
  })

  it('should have bottom margin', () => {
    const { container } = render(PageHeader, { props: { title: 'Test' } })
    const div = container.querySelector('div')
    expect(div?.className).toContain('mb-6')
  })

  it('should apply bold styling to title', () => {
    render(PageHeader, { props: { title: 'Bold Title' } })
    const heading = screen.getByRole('heading')
    expect(heading.className).toContain('font-bold')
  })
})
