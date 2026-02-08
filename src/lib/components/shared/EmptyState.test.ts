import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import EmptyState from './EmptyState.svelte'

describe('EmptyState', () => {
  it('should render with title', () => {
    render(EmptyState, { props: { title: 'No items found' } })
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('should render with description', () => {
    render(EmptyState, {
      props: {
        title: 'No items',
        description: 'Get started by creating one'
      }
    })
    expect(screen.getByText('Get started by creating one')).toBeInTheDocument()
  })

  it('should render default icon when no custom icon provided', () => {
    const { container } = render(EmptyState, { props: { title: 'Empty' } })
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should apply custom class', () => {
    const { container } = render(EmptyState, {
      props: { title: 'Empty', class: 'my-custom-class' }
    })
    const div = container.querySelector('div')
    expect(div?.className).toContain('my-custom-class')
  })

  it('should have dashed border style', () => {
    const { container } = render(EmptyState, { props: { title: 'Empty' } })
    const div = container.querySelector('div')
    expect(div?.className).toContain('border-dashed')
  })

  it('should center content', () => {
    const { container } = render(EmptyState, { props: { title: 'Empty' } })
    const div = container.querySelector('div')
    expect(div?.className).toContain('items-center')
    expect(div?.className).toContain('justify-center')
  })
})
