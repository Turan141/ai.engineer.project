import type { IChatMessage, TChatMessageRole } from "../../types/chat.types.js"
import type { IConversationMemory, ISummaryMemory, ISummaryService } from "./types.js"

export class MemoryService {
	constructor(
		private readonly conversationMemory: IConversationMemory,
		private readonly summaryMemory: ISummaryMemory,
		private readonly summaryService: ISummaryService,
		private readonly MAX_MESSAGES: number = 8,
		private readonly LAST_SAVED_MESSAGES_COUNT: number = 5
	) {}

	async addMessage(
		sessionId: string,
		content: string,
		role: TChatMessageRole
	): Promise<void> {
		await this.conversationMemory.addMessage(sessionId, {
			role,
			content
		})

		void this.checkAndSummarize(sessionId)
	}

	async checkAndSummarize(sessionId: string): Promise<void> {
		const messages = await this.conversationMemory.getMessages(sessionId)
		if (messages.length > this.MAX_MESSAGES) {
			const summarizedMessages = await this.summaryMemory.getSummary(sessionId)
			const messagesToSummarize = messages.slice(0, -this.LAST_SAVED_MESSAGES_COUNT)
			const summary = await this.summaryService.generateSummary(
				summarizedMessages,
				messagesToSummarize
			)
			await this.summaryMemory.addSummary(sessionId, summary)
			await this.conversationMemory.trim(sessionId, this.LAST_SAVED_MESSAGES_COUNT)
		}
	}

	async getConversationContext(sessionId: string): Promise<IChatMessage[]> {
		const messages = await this.conversationMemory.getMessages(sessionId)
		const summary = await this.summaryMemory.getSummary(sessionId)

		return [
			...(summary
				? [
						{
							role: "system",
							content: `Conversation summary:\n${summary}`
						} as IChatMessage
					]
				: []),
			...messages
		]
	}
}
