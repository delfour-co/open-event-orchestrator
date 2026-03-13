const STORAGE_KEY = 'oeo-session-reminders'
const DEFAULT_MINUTES_KEY = 'oeo-reminder-default-minutes'
const DEFAULT_REMINDER_MINUTES = 15

export interface SessionReminder {
  sessionId: string
  sessionTitle: string
  roomName: string
  startTime: string
  reminderMinutes: number
  editionSlug: string
  enabled: boolean
}

interface ReminderStore {
  [sessionId: string]: SessionReminder
}

function loadStore(): ReminderStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ReminderStore
  } catch {
    return {}
  }
}

function saveStore(store: ReminderStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function setReminder(reminder: SessionReminder): void {
  const store = loadStore()
  store[reminder.sessionId] = reminder
  saveStore(store)
}

function removeReminder(sessionId: string): void {
  const store = loadStore()
  delete store[sessionId]
  saveStore(store)
}

function getReminder(sessionId: string): SessionReminder | null {
  const store = loadStore()
  return store[sessionId] ?? null
}

function getAllReminders(): SessionReminder[] {
  const store = loadStore()
  return Object.values(store)
}

function getEnabledReminders(): SessionReminder[] {
  return getAllReminders().filter((r) => r.enabled)
}

function getDefaultReminderMinutes(): number {
  try {
    const raw = localStorage.getItem(DEFAULT_MINUTES_KEY)
    if (!raw) return DEFAULT_REMINDER_MINUTES
    const val = Number.parseInt(raw, 10)
    if ([15, 30, 60].includes(val)) return val
    return DEFAULT_REMINDER_MINUTES
  } catch {
    return DEFAULT_REMINDER_MINUTES
  }
}

function setDefaultReminderMinutes(minutes: number): void {
  localStorage.setItem(DEFAULT_MINUTES_KEY, String(minutes))
}

function hasReminder(sessionId: string): boolean {
  const store = loadStore()
  const entry = store[sessionId]
  return !!entry && entry.enabled
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }
  if (Notification.permission === 'granted') {
    return 'granted'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }
  return await Notification.requestPermission()
}

function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }
  return Notification.permission
}

function isNotificationSupported(): boolean {
  return typeof Notification !== 'undefined' && 'serviceWorker' in navigator
}

export const reminderService = {
  setReminder,
  removeReminder,
  getReminder,
  getAllReminders,
  getEnabledReminders,
  getDefaultReminderMinutes,
  setDefaultReminderMinutes,
  hasReminder,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported
}
