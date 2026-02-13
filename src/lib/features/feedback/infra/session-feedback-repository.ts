import type PocketBase from 'pocketbase'
import type {
	CreateSessionFeedback,
	SessionFeedback,
	UpdateSessionFeedback
} from '../domain/session-feedback'

export class SessionFeedbackRepository {
	constructor(private pb: PocketBase) {}

	async create(data: CreateSessionFeedback): Promise<SessionFeedback> {
		const record = await this.pb.collection('session_feedback').create({
			sessionId: data.sessionId,
			userId: data.userId,
			ratingMode: data.ratingMode,
			numericValue: data.numericValue,
			comment: data.comment
		})

		return this.mapRecord(record)
	}

	async update(data: UpdateSessionFeedback): Promise<SessionFeedback> {
		const record = await this.pb.collection('session_feedback').update(data.id, {
			numericValue: data.numericValue,
			comment: data.comment
		})

		return this.mapRecord(record)
	}

	async delete(id: string): Promise<void> {
		await this.pb.collection('session_feedback').delete(id)
	}

	async getById(id: string): Promise<SessionFeedback | null> {
		try {
			const record = await this.pb.collection('session_feedback').getOne(id)
			return this.mapRecord(record)
		} catch {
			return null
		}
	}

	async getBySession(sessionId: string): Promise<SessionFeedback[]> {
		const records = await this.pb.collection('session_feedback').getFullList({
			filter: `sessionId = "${sessionId}"`
		})

		return records.map((r) => this.mapRecord(r))
	}

	async getByUser(userId: string, editionId?: string): Promise<SessionFeedback[]> {
		let filter = `userId = "${userId}"`

		if (editionId) {
			// Need to join with sessions to filter by edition
			filter += ` && sessionId.editionId = "${editionId}"`
		}

		const records = await this.pb.collection('session_feedback').getFullList({
			filter,
			expand: 'sessionId'
		})

		return records.map((r) => this.mapRecord(r))
	}

	async getUserFeedbackForSession(
		userId: string,
		sessionId: string
	): Promise<SessionFeedback | null> {
		try {
			const records = await this.pb.collection('session_feedback').getFullList({
				filter: `userId = "${userId}" && sessionId = "${sessionId}"`,
				$autoCancel: false
			})

			if (records.length === 0) return null
			return this.mapRecord(records[0])
		} catch {
			return null
		}
	}

	private mapRecord(record: Record<string, unknown>): SessionFeedback {
		return {
			id: record.id as string,
			sessionId: record.sessionId as string,
			userId: record.userId as string,
			ratingMode: record.ratingMode as SessionFeedback['ratingMode'],
			numericValue: (record.numericValue as number | null) ?? null,
			comment: record.comment as string | undefined,
			createdAt: new Date(record.created as string),
			updatedAt: new Date(record.updated as string)
		}
	}
}
