import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import StatsCard from './StatsCard.svelte'

describe('StatsCard', () => {
  it('should render title', () => {
    render(StatsCard, { props: { title: 'Total Users', value: 100 } })
    expect(screen.getByText('Total Users')).toBeInTheDocument()
  })

  it('should render numeric value', () => {
    render(StatsCard, { props: { title: 'Count', value: 42 } })
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render string value', () => {
    render(StatsCard, { props: { title: 'Status', value: 'Active' } })
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should format number with separators', () => {
    render(StatsCard, { props: { title: 'Users', value: 1234567, format: 'number' } })
    const text = screen.getByText(/1.*234.*567/)
    expect(text).toBeInTheDocument()
  })

  it('should format as currency', () => {
    render(StatsCard, { props: { title: 'Revenue', value: 1000, format: 'currency' } })
    const element = screen.getByText(/1.*000/)
    expect(element).toBeInTheDocument()
  })

  it('should format as percent', () => {
    render(StatsCard, { props: { title: 'Rate', value: 75, format: 'percent' } })
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should render description', () => {
    render(StatsCard, {
      props: { title: 'Users', value: 100, description: 'Last 30 days' }
    })
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
  })

  it('should render positive trend', () => {
    render(StatsCard, {
      props: { title: 'Users', value: 100, trend: { value: 12.5 } }
    })
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('should render negative trend', () => {
    render(StatsCard, {
      props: { title: 'Errors', value: 5, trend: { value: -8.3 } }
    })
    expect(screen.getByText('-8.3%')).toBeInTheDocument()
  })

  it('should render trend label', () => {
    render(StatsCard, {
      props: { title: 'Sales', value: 500, trend: { value: 10, label: 'vs last month' } }
    })
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('should apply custom class', () => {
    const { container } = render(StatsCard, {
      props: { title: 'Test', value: 0, class: 'my-card-class' }
    })
    const card = container.querySelector('div')
    expect(card?.className).toContain('my-card-class')
  })

  it('should have card styling', () => {
    const { container } = render(StatsCard, { props: { title: 'Test', value: 0 } })
    const card = container.querySelector('div')
    expect(card?.className).toContain('rounded-lg')
    expect(card?.className).toContain('border')
  })
})
