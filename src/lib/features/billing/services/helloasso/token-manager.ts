const TOKEN_MARGIN_MS = 2 * 60 * 1000 // 2 minutes margin

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface HelloAssoTokenManager {
  getAccessToken(): Promise<string>
  invalidate(): void
}

export const createHelloAssoTokenManager = (
  clientId: string,
  clientSecret: string,
  apiBase: string
): HelloAssoTokenManager => {
  let cached: TokenData | null = null

  async function fetchToken(
    grantType: 'client_credentials' | 'refresh_token',
    refreshToken?: string
  ): Promise<TokenData> {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType
    })

    if (grantType === 'refresh_token' && refreshToken) {
      body.set('refresh_token', refreshToken)
    }

    const response = await fetch(`${apiBase}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HelloAsso OAuth error (${response.status}): ${errorText}`)
    }

    const data = (await response.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    }
  }

  function isExpired(token: TokenData): boolean {
    return Date.now() >= token.expiresAt - TOKEN_MARGIN_MS
  }

  return {
    async getAccessToken(): Promise<string> {
      if (cached && !isExpired(cached)) {
        return cached.accessToken
      }

      if (cached?.refreshToken) {
        try {
          cached = await fetchToken('refresh_token', cached.refreshToken)
          return cached.accessToken
        } catch {
          // Refresh failed, fall through to new token
          cached = null
        }
      }

      cached = await fetchToken('client_credentials')
      return cached.accessToken
    },

    invalidate(): void {
      cached = null
    }
  }
}
