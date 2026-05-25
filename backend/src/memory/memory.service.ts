import type { IChatMessage } from "../types/chat.types.js"
import type { IConversationMemory } from "./types.js"

export class MemoryService {
	constructor(private readonly memory: IConversationMemory) {}

	async addUserMessage(sessionId: string, content: string): Promise<void> {
		await this.memory.addMessage(sessionId, {
			role: "user",
			content
		})
	}

	async addAssistantMessage(sessionId: string, content: string): Promise<void> {
		await this.memory.addMessage(sessionId, {
			role: "assistant",
			content
		})
	}

	async getConversation(sessionId: string): Promise<IChatMessage[]> {
		return this.memory.getMessages(sessionId)
	}
}
