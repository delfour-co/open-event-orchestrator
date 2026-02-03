import { z } from 'zod'

export const commentSchema = z.object({
  id: z.string(),
  talkId: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().default(true),
  createdAt: z.date()
})

export type Comment = z.infer<typeof commentSchema>

export const createCommentSchema = commentSchema.omit({
  id: true,
  createdAt: true
})

export type CreateComment = z.infer<typeof createCommentSchema>

export const sortCommentsByDate = (
  comments: Comment[],
  order: 'asc' | 'desc' = 'asc'
): Comment[] => {
  return [...comments].sort((a, b) => {
    const diff = a.createdAt.getTime() - b.createdAt.getTime()
    return order === 'asc' ? diff : -diff
  })
}

export const filterInternalComments = (comments: Comment[]): Comment[] => {
  return comments.filter((c) => c.isInternal)
}

export const filterPublicComments = (comments: Comment[]): Comment[] => {
  return comments.filter((c) => !c.isInternal)
}
