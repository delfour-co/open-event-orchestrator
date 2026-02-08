/**
 * OEO Schedule Widget
 *
 * Usage:
 * <oeo-schedule
 *   api-url="https://your-oeo-instance.com/api/v1"
 *   api-key="oeo_live_xxx"
 *   edition-id="abc123">
 * </oeo-schedule>
 */

import { type ScheduleSession, type Track, WidgetApiClient } from '../shared/api-client'
import { BaseWidget } from '../shared/base-widget'

const SCHEDULE_STYLES = `
  :host { display: block; font-family: system-ui, -apple-system, sans-serif; }
  .schedule-container { max-width: 1200px; margin: 0 auto; }
  .filters { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
  .filter-btn { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; background: white; cursor: pointer; font-size: 14px; transition: all 0.2s; }
  .filter-btn:hover { background: #f9fafb; }
  .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
  .time-slot { margin-bottom: 24px; }
  .time-header { font-weight: 600; color: #374151; margin-bottom: 12px; padding: 8px 0; border-bottom: 2px solid #e5e7eb; }
  .sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .session-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: box-shadow 0.2s; }
  .session-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .session-card.break { background: #f3f4f6; }
  .session-track { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-bottom: 8px; }
  .session-title { font-weight: 600; font-size: 16px; color: #111827; margin-bottom: 8px; }
  .session-meta { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
  .session-speakers { display: flex; flex-wrap: wrap; gap: 8px; }
  .speaker-tag { background: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
  .empty-state { text-align: center; padding: 48px; color: #6b7280; }
`

export class ScheduleWidget extends BaseWidget {
  private sessions: ScheduleSession[] = []
  private tracks: Track[] = []
  private selectedDate: string | null = null
  private selectedTrack: string | null = null
  private dates: string[] = []

  protected render(): void {
    this.renderLoading()
  }

  protected async loadData(): Promise<void> {
    if (!this.apiUrl || !this.apiKey || !this.editionId) return

    try {
      const client = new WidgetApiClient({ apiUrl: this.apiUrl, apiKey: this.apiKey })
      const response = await client.getSchedule(this.editionId)

      this.sessions = response.data.sessions
      this.tracks = response.data.tracks
      this.dates = [
        ...new Set(this.sessions.map((s) => s.date).filter((d): d is string => d !== null))
      ].sort()

      if (this.dates.length > 0 && !this.selectedDate) {
        this.selectedDate = this.dates[0]
      }

      this.renderSchedule()
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : 'Failed to load schedule')
    }
  }

  private renderDateFilters(): string {
    return this.dates
      .map(
        (date) =>
          `<button class="filter-btn ${this.selectedDate === date ? 'active' : ''}" data-date="${date}">${this.formatDate(date)}</button>`
      )
      .join('')
  }

  private renderTrackFilters(): string {
    if (this.tracks.length <= 1) return ''
    const allBtn = `<button class="filter-btn ${!this.selectedTrack ? 'active' : ''}" data-track="">All Tracks</button>`
    const trackBtns = this.tracks
      .map(
        (track) =>
          `<button class="filter-btn ${this.selectedTrack === track.id ? 'active' : ''}" data-track="${track.id}" style="${track.color ? `border-color: ${this.sanitizeCssColor(track.color)}` : ''}">${this.escapeHtml(track.name)}</button>`
      )
      .join('')
    return `<div class="filter-group">${allBtn}${trackBtns}</div>`
  }

  private renderSessionCard(session: ScheduleSession): string {
    const trackHtml = session.track
      ? `<span class="session-track" style="background-color: ${this.sanitizeCssColor(session.track.color) || '#e5e7eb'}20; color: ${this.sanitizeCssColor(session.track.color) || '#374151'}">${this.escapeHtml(session.track.name)}</span>`
      : ''
    const roomHtml = session.room
      ? `<div class="session-meta">${this.escapeHtml(session.room.name)}</div>`
      : ''
    const speakersHtml =
      session.speakers.length > 0
        ? `<div class="session-speakers">${session.speakers.map((s) => `<span class="speaker-tag">${this.escapeHtml(s.firstName)} ${this.escapeHtml(s.lastName)}${s.company ? `<span style="opacity: 0.7">@ ${this.escapeHtml(s.company)}</span>` : ''}</span>`).join('')}</div>`
        : ''
    return `<div class="session-card ${session.type === 'break' ? 'break' : ''}">${trackHtml}<div class="session-title">${this.escapeHtml(session.title)}</div>${roomHtml}${speakersHtml}</div>`
  }

  private renderTimeSlots(timeSlots: [string, ScheduleSession[]][]): string {
    if (timeSlots.length === 0) {
      return '<div class="empty-state"><p>No sessions found for the selected filters.</p></div>'
    }
    return timeSlots
      .map(
        ([, sessions]) =>
          `<div class="time-slot"><div class="time-header">${this.formatTime(sessions[0].startTime)} - ${this.formatTime(sessions[0].endTime)}</div><div class="sessions-grid">${sessions.map((s) => this.renderSessionCard(s)).join('')}</div></div>`
      )
      .join('')
  }

  private renderSchedule(): void {
    const filteredSessions = this.sessions.filter((s) => {
      if (this.selectedDate && s.date !== this.selectedDate) return false
      if (this.selectedTrack && s.track?.id !== this.selectedTrack) return false
      return true
    })

    const byTimeSlot = new Map<string, ScheduleSession[]>()
    for (const session of filteredSessions) {
      const key = `${session.startTime}-${session.endTime}`
      const existing = byTimeSlot.get(key)
      if (existing) existing.push(session)
      else byTimeSlot.set(key, [session])
    }

    const timeSlots = [...byTimeSlot.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    this.shadow.innerHTML = `
      <style>${SCHEDULE_STYLES}</style>
      <div class="schedule-container">
        <div class="filters">
          <div class="filter-group">${this.renderDateFilters()}</div>
          ${this.renderTrackFilters()}
        </div>
        ${this.renderTimeSlots(timeSlots)}
      </div>
    `

    this.attachFilterListeners()
  }

  private attachFilterListeners(): void {
    for (const btn of this.shadow.querySelectorAll('.filter-btn[data-date]')) {
      btn.addEventListener('click', () => {
        this.selectedDate = btn.getAttribute('data-date')
        this.renderSchedule()
      })
    }
    for (const btn of this.shadow.querySelectorAll('.filter-btn[data-track]')) {
      btn.addEventListener('click', () => {
        this.selectedTrack = btn.getAttribute('data-track') || null
        this.renderSchedule()
      })
    }
  }
}

// Register custom element
customElements.define('oeo-schedule', ScheduleWidget)
