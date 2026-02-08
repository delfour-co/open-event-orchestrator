/**
 * API client for embeddable widgets
 */

export type ApiConfig = {
  apiUrl: string
  apiKey: string
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export class WidgetApiClient {
  private apiUrl: string
  private apiKey: string

  constructor(config: ApiConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `API error: ${response.status}`)
    }

    return response.json()
  }

  async getSchedule(editionId: string): Promise<ScheduleResponse> {
    return this.fetch<ScheduleResponse>(`/editions/${editionId}/schedule`)
  }

  async getSpeakers(
    editionId: string,
    page = 1,
    perPage = 50
  ): Promise<PaginatedResponse<Speaker>> {
    return this.fetch<PaginatedResponse<Speaker>>(
      `/editions/${editionId}/speakers?page=${page}&per_page=${perPage}`
    )
  }

  async getTicketTypes(editionId: string): Promise<PaginatedResponse<TicketType>> {
    return this.fetch<PaginatedResponse<TicketType>>(
      `/editions/${editionId}/ticket-types?active=true`
    )
  }

  async getEdition(editionId: string): Promise<{ data: Edition }> {
    return this.fetch<{ data: Edition }>(`/editions/${editionId}`)
  }
}

export type Edition = {
  id: string
  name: string
  slug: string
  year: number
  startDate: string
  endDate: string
  venue: string | null
  city: string | null
  country: string | null
  status: string
}

export type Room = {
  id: string
  name: string
  capacity: number | null
  floor: string | null
}

export type Track = {
  id: string
  name: string
  color: string | null
  description: string | null
}

export type ScheduleSession = {
  id: string
  title: string
  description: string | null
  type: string
  date: string | null
  startTime: string | null
  endTime: string | null
  room: { id: string; name: string } | null
  track: { id: string; name: string; color: string | null } | null
  speakers: Array<{
    id: string
    firstName: string
    lastName: string
    company: string | null
  }>
}

export type ScheduleResponse = {
  data: {
    edition: Edition
    rooms: Room[]
    tracks: Track[]
    sessions: ScheduleSession[]
  }
}

export type Speaker = {
  id: string
  firstName: string
  lastName: string
  email: string
  bio: string | null
  company: string | null
  jobTitle: string | null
  photoUrl: string | null
  twitter: string | null
  github: string | null
  linkedin: string | null
  city: string | null
  country: string | null
}

export type TicketType = {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  quantity: number
  quantitySold: number
  quantityAvailable: number
  salesStartDate: string | null
  salesEndDate: string | null
  isActive: boolean
}
