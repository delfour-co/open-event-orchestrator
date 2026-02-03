import { describe, expect, it } from 'vitest'
import {
  type Comment,
  commentSchema,
  createCommentSchema,
  filterInternalComments,
  filterPublicComments,
  sortCommentsByDate
} from './comment'

describe('comment domain', () => {
  describe('commentSchema', () => {
    it('should validate a complete comment', () => {
      const comment = {
        id: 'comment-1',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'This is a great proposal',
        isInternal: true,
        createdAt: new Date()
      }

      expect(commentSchema.safeParse(comment).success).toBe(true)
    })

    it('should reject empty content', () => {
      const comment = {
        id: 'comment-1',
        talkId: 'talk-1',
        userId: 'user-1',
        content: '',
        isInternal: true,
        createdAt: new Date()
      }

      expect(commentSchema.safeParse(comment).success).toBe(false)
    })

    it('should reject content exceeding 5000 characters', () => {
      const comment = {
        id: 'comment-1',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'a'.repeat(5001),
        isInternal: true,
        createdAt: new Date()
      }

      expect(commentSchema.safeParse(comment).success).toBe(false)
    })

    it('should accept content up to 5000 characters', () => {
      const comment = {
        id: 'comment-1',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'a'.repeat(5000),
        isInternal: true,
        createdAt: new Date()
      }

      expect(commentSchema.safeParse(comment).success).toBe(true)
    })
  })

  describe('createCommentSchema', () => {
    it('should validate creation data without id and createdAt', () => {
      const data = {
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'Comment content',
        isInternal: true
      }

      expect(createCommentSchema.safeParse(data).success).toBe(true)
    })

    it('should default isInternal to true', () => {
      const data = {
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'Comment content'
      }

      const result = createCommentSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isInternal).toBe(true)
      }
    })
  })

  describe('sortCommentsByDate', () => {
    const createComment = (id: string, daysAgo: number): Comment => ({
      id,
      talkId: 'talk-1',
      userId: 'user-1',
      content: `Comment ${id}`,
      isInternal: true,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    })

    const comments: Comment[] = [
      createComment('c2', 1), // 1 day ago
      createComment('c1', 2), // 2 days ago
      createComment('c3', 0) // now
    ]

    it('should sort comments in ascending order by default', () => {
      const sorted = sortCommentsByDate(comments)
      expect(sorted[0].id).toBe('c1')
      expect(sorted[1].id).toBe('c2')
      expect(sorted[2].id).toBe('c3')
    })

    it('should sort comments in descending order', () => {
      const sorted = sortCommentsByDate(comments, 'desc')
      expect(sorted[0].id).toBe('c3')
      expect(sorted[1].id).toBe('c2')
      expect(sorted[2].id).toBe('c1')
    })

    it('should not mutate the original array', () => {
      const original = [...comments]
      sortCommentsByDate(comments)
      expect(comments).toEqual(original)
    })

    it('should handle empty array', () => {
      expect(sortCommentsByDate([])).toEqual([])
    })
  })

  describe('filterInternalComments', () => {
    const comments: Comment[] = [
      {
        id: 'c1',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'Internal comment',
        isInternal: true,
        createdAt: new Date()
      },
      {
        id: 'c2',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'Public comment',
        isInternal: false,
        createdAt: new Date()
      },
      {
        id: 'c3',
        talkId: 'talk-1',
        userId: 'user-2',
        content: 'Another internal',
        isInternal: true,
        createdAt: new Date()
      }
    ]

    it('should return only internal comments', () => {
      const internal = filterInternalComments(comments)
      expect(internal).toHaveLength(2)
      expect(internal.every((c) => c.isInternal)).toBe(true)
    })

    it('should handle empty array', () => {
      expect(filterInternalComments([])).toEqual([])
    })
  })

  describe('filterPublicComments', () => {
    const comments: Comment[] = [
      {
        id: 'c1',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'Internal comment',
        isInternal: true,
        createdAt: new Date()
      },
      {
        id: 'c2',
        talkId: 'talk-1',
        userId: 'user-1',
        content: 'Public comment',
        isInternal: false,
        createdAt: new Date()
      }
    ]

    it('should return only public comments', () => {
      const publicComments = filterPublicComments(comments)
      expect(publicComments).toHaveLength(1)
      expect(publicComments[0].id).toBe('c2')
    })

    it('should handle empty array', () => {
      expect(filterPublicComments([])).toEqual([])
    })
  })
})
