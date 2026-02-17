import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.svelte'

describe('PasswordStrengthIndicator', () => {
  it('should render without crashing', () => {
    const { container } = render(PasswordStrengthIndicator, {
      props: { password: '' }
    })
    expect(container).toBeTruthy()
  })

  it('should show strength bars', () => {
    const { container } = render(PasswordStrengthIndicator, {
      props: { password: 'test' }
    })
    const bars = container.querySelectorAll('.rounded-full')
    expect(bars.length).toBe(4)
  })

  it('should show label when password is provided', () => {
    const { container } = render(PasswordStrengthIndicator, {
      props: { password: 'short' }
    })
    // 'short' is 5 chars with lowercase only = Very weak (score 0)
    expect(container.textContent).toContain('Very weak')
  })

  it('should not show label when password is empty', () => {
    const { container } = render(PasswordStrengthIndicator, {
      props: { password: '' }
    })
    // Should not display strength label for empty password
    const strongLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
    for (const label of strongLabels) {
      expect(container.textContent).not.toContain(label)
    }
  })

  it('should show Strong for complex password', () => {
    const { container } = render(PasswordStrengthIndicator, {
      props: { password: 'MyV3ryStr0ng!Pass' }
    })
    expect(container.textContent).toContain('Strong')
  })
})
