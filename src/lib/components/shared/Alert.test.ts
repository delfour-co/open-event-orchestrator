import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import AlertWrapper from './AlertWrapper.test.svelte'

describe('Alert', () => {
  it('should render with title', () => {
    render(AlertWrapper, { props: { title: 'Alert Title', content: 'Alert message' } })
    expect(screen.getByText('Alert Title')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(AlertWrapper, { props: { title: 'Test', content: 'This is the message' } })
    expect(screen.getByText('This is the message')).toBeInTheDocument()
  })

  it('should have alert role', () => {
    render(AlertWrapper, { props: { content: 'Test message' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should apply success variant classes', () => {
    const { container } = render(AlertWrapper, {
      props: { variant: 'success', content: 'Success!' }
    })
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.className).toContain('green')
  })

  it('should apply error variant classes', () => {
    const { container } = render(AlertWrapper, {
      props: { variant: 'error', content: 'Error!' }
    })
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.className).toContain('red')
  })

  it('should apply warning variant classes', () => {
    const { container } = render(AlertWrapper, {
      props: { variant: 'warning', content: 'Warning!' }
    })
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.className).toContain('yellow')
  })

  it('should apply info variant classes', () => {
    const { container } = render(AlertWrapper, {
      props: { variant: 'info', content: 'Info' }
    })
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.className).toContain('blue')
  })

  it('should show dismiss button when dismissible', () => {
    render(AlertWrapper, {
      props: { content: 'Dismissible', dismissible: true, onDismiss: vi.fn() }
    })
    expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument()
  })

  it('should not show dismiss button when not dismissible', () => {
    render(AlertWrapper, { props: { content: 'Not dismissible' } })
    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument()
  })

  it('should call onDismiss when clicking dismiss button', async () => {
    const onDismiss = vi.fn()
    render(AlertWrapper, {
      props: { content: 'Test', dismissible: true, onDismiss }
    })

    await fireEvent.click(screen.getByLabelText('Dismiss alert'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('should render default icon for variant', () => {
    const { container } = render(AlertWrapper, { props: { variant: 'success', content: 'Test' } })
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
