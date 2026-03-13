import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notesService } from './notes-service'

describe('notesService', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      })
    })
  })

  describe('saveNote and getNote', () => {
    it('should save and retrieve a note', () => {
      notesService.saveNote('session-1', 'My note')
      expect(notesService.getNote('session-1')).toBe('My note')
    })

    it('should return null for non-existent note', () => {
      expect(notesService.getNote('non-existent')).toBeNull()
    })

    it('should delete note when content is empty after trimming', () => {
      notesService.saveNote('session-1', 'My note')
      notesService.saveNote('session-1', '   ')
      expect(notesService.getNote('session-1')).toBeNull()
    })

    it('should overwrite existing note', () => {
      notesService.saveNote('session-1', 'First')
      notesService.saveNote('session-1', 'Second')
      expect(notesService.getNote('session-1')).toBe('Second')
    })
  })

  describe('deleteNote', () => {
    it('should delete an existing note', () => {
      notesService.saveNote('session-1', 'My note')
      notesService.deleteNote('session-1')
      expect(notesService.getNote('session-1')).toBeNull()
    })

    it('should not throw when deleting non-existent note', () => {
      expect(() => notesService.deleteNote('non-existent')).not.toThrow()
    })
  })

  describe('hasNote', () => {
    it('should return true when note exists', () => {
      notesService.saveNote('session-1', 'My note')
      expect(notesService.hasNote('session-1')).toBe(true)
    })

    it('should return false when note does not exist', () => {
      expect(notesService.hasNote('non-existent')).toBe(false)
    })

    it('should return false when note content is empty', () => {
      notesService.saveNote('session-1', 'temp')
      notesService.saveNote('session-1', '   ')
      expect(notesService.hasNote('session-1')).toBe(false)
    })
  })

  describe('getAllNotes', () => {
    it('should return all notes', () => {
      notesService.saveNote('session-1', 'Note 1')
      notesService.saveNote('session-2', 'Note 2')
      const notes = notesService.getAllNotes()
      expect(notes).toHaveLength(2)
      expect(notes.map((n) => n.sessionId).sort()).toEqual(['session-1', 'session-2'])
    })

    it('should return empty array when no notes', () => {
      expect(notesService.getAllNotes()).toEqual([])
    })
  })

  describe('searchNotes', () => {
    it('should find notes matching query', () => {
      notesService.saveNote('session-1', 'Great talk about TypeScript')
      notesService.saveNote('session-2', 'Interesting Svelte session')
      notesService.saveNote('session-3', 'Lunch break')

      const results = notesService.searchNotes('typescript')
      expect(results).toHaveLength(1)
      expect(results[0].sessionId).toBe('session-1')
    })

    it('should be case-insensitive', () => {
      notesService.saveNote('session-1', 'Great Talk')
      const results = notesService.searchNotes('great talk')
      expect(results).toHaveLength(1)
    })

    it('should return empty for no matches', () => {
      notesService.saveNote('session-1', 'Hello')
      expect(notesService.searchNotes('xyz')).toEqual([])
    })
  })

  describe('exportNotes', () => {
    it('should format notes with session titles', () => {
      notesService.saveNote('session-1', 'Note about TypeScript')
      notesService.saveNote('session-2', 'Note about Svelte')

      const sessions = new Map<string, string>([
        ['session-1', 'TypeScript Deep Dive'],
        ['session-2', 'Svelte 5 Features']
      ])

      const exported = notesService.exportNotes(sessions)
      expect(exported).toContain('TypeScript Deep Dive')
      expect(exported).toContain('---')
      expect(exported).toContain('Note about TypeScript')
      expect(exported).toContain('Svelte 5 Features')
      expect(exported).toContain('Note about Svelte')
    })

    it('should return empty string when no notes', () => {
      const sessions = new Map<string, string>()
      expect(notesService.exportNotes(sessions)).toBe('')
    })

    it('should use fallback title for unknown sessions', () => {
      notesService.saveNote('unknown-id', 'Some note')
      const sessions = new Map<string, string>()
      const exported = notesService.exportNotes(sessions)
      expect(exported).toContain('Unknown session')
    })
  })
})
