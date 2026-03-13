const STORAGE_KEY = 'oeo-session-notes'

export interface SessionNote {
  sessionId: string
  content: string
  updatedAt: number
}

interface NotesStore {
  [sessionId: string]: { content: string; updatedAt: number }
}

function loadStore(): NotesStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as NotesStore
  } catch {
    return {}
  }
}

function saveStore(store: NotesStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getNote(sessionId: string): string | null {
  const store = loadStore()
  return store[sessionId]?.content ?? null
}

function saveNote(sessionId: string, content: string): void {
  const store = loadStore()
  const trimmed = content.trim()
  if (!trimmed) {
    delete store[sessionId]
  } else {
    store[sessionId] = { content, updatedAt: Date.now() }
  }
  saveStore(store)
}

function deleteNote(sessionId: string): void {
  const store = loadStore()
  delete store[sessionId]
  saveStore(store)
}

function getAllNotes(): SessionNote[] {
  const store = loadStore()
  return Object.entries(store).map(([sessionId, data]) => ({
    sessionId,
    content: data.content,
    updatedAt: data.updatedAt
  }))
}

function searchNotes(query: string): SessionNote[] {
  const lower = query.toLowerCase()
  return getAllNotes().filter((note) => note.content.toLowerCase().includes(lower))
}

function exportNotes(sessions: Map<string, string>): string {
  const allNotes = getAllNotes().sort((a, b) => a.updatedAt - b.updatedAt)
  if (allNotes.length === 0) return ''

  return allNotes
    .map((note) => {
      const title = sessions.get(note.sessionId) ?? 'Unknown session'
      return `${title}\n---\n${note.content}`
    })
    .join('\n\n')
}

function hasNote(sessionId: string): boolean {
  const store = loadStore()
  const entry = store[sessionId]
  return !!entry && entry.content.trim().length > 0
}

export const notesService = {
  getNote,
  saveNote,
  deleteNote,
  getAllNotes,
  searchNotes,
  exportNotes,
  hasNote
}
