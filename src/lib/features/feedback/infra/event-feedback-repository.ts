import type PocketBase from 'pocketbase'
import type {
	CreateEventFeedback,
	EventFeedback,
	UpdateEventFeedback
} from '../domain/event-feedback'

export class EventFeedbackRepository {
	constructor(private pb: PocketBase) {}

	async create(data: CreateEventFeedback): Promise<EventFeedback> {
		const record = await this.pb.collection('event_feedback').create({
			editionId: data.editionId,
			userId: data.userId,
			feedbackType: data.feedbackType,
			subject: data.subject,
			message: data.message,
			status: data.status || 'open'
		})

		return this.mapRecord(record)
	}

	async update(data: UpdateEventFeedback): Promise<EventFeedback> {
		const record = await this.pb.collection('event_feedback').update(data.id, {
			subject: data.subject,
			message: data.message,
			status: data.status
		})

		return this.mapRecord(record)
	}

	async delete(id: string): Promise<void> {
		await this.pb.collection('event_feedback').delete(id)
	}

	async getById(id: string): Promise<EventFeedback | null> {
		try {
			const record = await this.pb.collection('event_feedback').getOne(id)
			return this.mapRecord(record)
		} catch {
			return null
		}
	}

	async getByEdition(editionId: string): Promise<EventFeedback[]> {
		const records = await this.pb.collection('event_feedback').getFullList({
			filter: `editionId = "${editionId}"`,
			sort: '-created'
		})

		return records.map((r) => this.mapRecord(r))
	}

	async getByUser(userId: string, editionId?: string): Promise<EventFeedback[]> {
		let filter = `userId = "${userId}"`

		if (editionId) {
			filter += ` && editionId = "${editionId}"`
		}

		const records = await this.pb.collection('event_feedback').getFullList({
			filter,
			sort: '-created'
		})

		return records.map((r) => this.mapRecord(r))
	}

	private mapRecord(record: Record<string, unknown>): EventFeedback {
		return {
			id: record.id as string,
			editionId: record.editionId as string,
			userId: record.userId as string,
			feedbackType: record.feedbackType as EventFeedback['feedbackType'],
			subject: record.subject as string | undefined,
			message: record.message as string,
			status: record.status as EventFeedback['status'],
			createdAt: new Date(record.created as string),
			updatedAt: new Date(record.updated as string)
		}
	}
}
