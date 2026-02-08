import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import SearchInput from './SearchInput.svelte'

describe('SearchInput', () => {
  it('should render input with placeholder', () => {
    render(SearchInput, { props: { placeholder: 'Search...' } })
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should render with default placeholder', () => {
    render(SearchInput)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should render search icon', () => {
    const { container } = render(SearchInput)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should update value on input', async () => {
    render(SearchInput)
    const input = screen.getByRole('searchbox')

    await fireEvent.input(input, { target: { value: 'test query' } })
    expect(input).toHaveValue('test query')
  })

  it('should show clear button when has value', async () => {
    render(SearchInput, { props: { value: 'test' } })
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('should clear value when clicking clear button', async () => {
    render(SearchInput, { props: { value: 'test' } })
    const clearButton = screen.getByLabelText('Clear search')

    await fireEvent.click(clearButton)
    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('')
  })

  it('should show loading spinner when loading', () => {
    const { container } = render(SearchInput, { props: { loading: true, value: 'test' } })
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should not show clear button when loading', () => {
    render(SearchInput, { props: { loading: true, value: 'test' } })
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
  })

  it('should apply custom class', () => {
    const { container } = render(SearchInput, { props: { class: 'my-search-class' } })
    const wrapper = container.querySelector('div')
    expect(wrapper?.className).toContain('my-search-class')
  })

  it('should have type search on input', () => {
    render(SearchInput)
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('type', 'search')
  })
})
