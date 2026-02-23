import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHelloAssoTokenManager } from './token-manager'

describe('token-manager', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const createManager = () =>
    createHelloAssoTokenManager('client-id', 'client-secret', 'https://api.helloasso.com')

  const mockTokenResponse = (accessToken = 'test-token', expiresIn = 1800) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: accessToken,
          refresh_token: 'refresh-token',
          expires_in: expiresIn
        })
    })
  }

  it('should fetch a new token via client_credentials', async () => {
    mockTokenResponse('my-token')

    const manager = createManager()
    const token = await manager.getAccessToken()

    expect(token).toBe('my-token')
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.helloasso.com/oauth2/token',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should return cached token on second call', async () => {
    mockTokenResponse('cached-token')

    const manager = createManager()
    const token1 = await manager.getAccessToken()
    const token2 = await manager.getAccessToken()

    expect(token1).toBe('cached-token')
    expect(token2).toBe('cached-token')
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('should refresh token when expired', async () => {
    mockTokenResponse('first-token', 300) // 5 minutes
    const manager = createManager()
    const token1 = await manager.getAccessToken()
    expect(token1).toBe('first-token')

    // Advance past expiry (5 min - 2 min margin = 3 min)
    vi.advanceTimersByTime(4 * 60 * 1000)

    mockTokenResponse('refreshed-token')
    const token2 = await manager.getAccessToken()
    expect(token2).toBe('refreshed-token')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should fall back to client_credentials when refresh fails', async () => {
    mockTokenResponse('first-token', 300)
    const manager = createManager()
    await manager.getAccessToken()

    vi.advanceTimersByTime(4 * 60 * 1000)

    // Refresh fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('refresh failed')
    })

    // Fall back to client_credentials
    mockTokenResponse('new-token')
    const token = await manager.getAccessToken()
    expect(token).toBe('new-token')
  })

  it('should throw on OAuth error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized')
    })

    const manager = createManager()
    await expect(manager.getAccessToken()).rejects.toThrow('HelloAsso OAuth error (401)')
  })

  it('should clear cache on invalidate', async () => {
    mockTokenResponse('first-token')
    const manager = createManager()
    await manager.getAccessToken()

    manager.invalidate()

    mockTokenResponse('second-token')
    const token = await manager.getAccessToken()
    expect(token).toBe('second-token')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
