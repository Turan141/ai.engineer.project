import type { IChatMessage } from "../types/chat.types.js"
import type { IConversationMemory } from "./types.js"

export class InMemoryConversationMemory implements IConversationMemory {
	private readonly conversations: Map<string, IChatMessage[]> = new Map()

	constructor() {}

	async addMessage(sessionId: string, message: IChatMessage): Promise<void> {
		const messages = this.conversations.get(sessionId) || []
		messages.push(message)
		this.conversations.set(sessionId, messages)
	}

	async clear(sessionId: string): Promise<void> {
		this.conversations.delete(sessionId)
	}

	async getMessages(sessionId: string): Promise<IChatMessage[]> {
		return Promise.resolve(this.conversations.get(sessionId) || [])
	}
}
