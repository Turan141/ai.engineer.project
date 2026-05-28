import type { IChatMessage, TChatMessageRole } from "../../types/chat.types.js"
import type { IMessageRepository, ISummaryRepository, ISummaryService } from "./types.js"

export class MemoryService {
	constructor(
		private readonly summaryService: ISummaryService,
		private readonly messageRepository: IMessageRepository,
		private readonly summaryRepository: ISummaryRepository,
		private readonly MAX_MESSAGES: number = 8,
		private readonly LAST_SAVED_MESSAGES_COUNT: number = 5
	) {}

	async addMessage(
		sessionId: string,
		content: string,
		role: TChatMessageRole
	): Promise<void> {
		await this.messageRepository.addMessage(sessionId, {
			role,
			content
		})

		void this.checkAndSummarize(sessionId)
	}

	async getMessages(sessionId: string): Promise<IChatMessage[]> {
		return this.messageRepository.getMessages(sessionId)
	}

	async checkAndSummarize(sessionId: string): Promise<void> {
		const messages = await this.messageRepository.getMessages(sessionId)
		if (messages.length > this.MAX_MESSAGES) {
			const summarizedMessages = await this.summaryRepository.getSummary(sessionId)
			const messagesToSummarize = messages.slice(0, -this.LAST_SAVED_MESSAGES_COUNT)
			const summary = await this.summaryService.generateSummary(
				summarizedMessages,
				messagesToSummarize
			)
			await this.summaryRepository.addSummary(sessionId, summary)
			await this.messageRepository.trim(sessionId, this.LAST_SAVED_MESSAGES_COUNT)
		}
	}

	async getConversationContext(sessionId: string): Promise<IChatMessage[]> {
		const messages = await this.messageRepository.getMessages(sessionId)
		const summary = await this.summaryRepository.getSummary(sessionId)

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
