import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import UrlCopyBar from './UrlCopyBar.svelte'

describe('UrlCopyBar', () => {
  it('should render label text', () => {
    render(UrlCopyBar, { props: { label: 'CFP URL', path: '/cfp/my-edition' } })
    expect(screen.getByText('CFP URL:')).toBeInTheDocument()
  })

  it('should render path text', () => {
    render(UrlCopyBar, { props: { label: 'CFP URL', path: '/cfp/my-edition' } })
    expect(screen.getByText('/cfp/my-edition')).toBeInTheDocument()
  })

  it('should have a copy button', () => {
    render(UrlCopyBar, { props: { label: 'URL', path: '/test' } })
    expect(screen.getByTitle('Copy URL')).toBeInTheDocument()
  })

  it('should have an external link', () => {
    render(UrlCopyBar, { props: { label: 'URL', path: '/test' } })
    const link = screen.getByTitle('Open in new tab')
    expect(link.closest('a')).toHaveAttribute('href', '/test')
    expect(link.closest('a')).toHaveAttribute('target', '_blank')
  })
})
