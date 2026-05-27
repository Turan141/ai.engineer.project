import type { IChatMessage } from "../../types/chat.types.js"
import type { IMessageRepository } from "../../services/memory/types.js"

export class MessageMemory implements IMessageRepository {
	private readonly conversations: Map<string, IChatMessage[]> = new Map()

	constructor() {}

	async addMessage(sessionId: string, message: IChatMessage): Promise<void> {
		const messages = this.conversations.get(sessionId) || []
		messages.push(message)
		this.conversations.set(sessionId, messages)
	}

	async trim(sessionId: string, qtyToSave: number): Promise<void> {
		this.conversations.set(
			sessionId,
			(this.conversations.get(sessionId) || []).slice(-qtyToSave)
		)
	}

	async getMessages(sessionId: string): Promise<IChatMessage[]> {
		return Promise.resolve(this.conversations.get(sessionId) || [])
	}
}
