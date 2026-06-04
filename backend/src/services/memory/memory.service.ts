import type { IChatMessage, TChatMessageRole } from "../../types/chat.types.js"
import type { IMessageRepository, ISummaryRepository, ISummaryService } from "./types.js"

const MAX_MEMORY_MESSAGE_CHARS = 4_000
const MAX_SUMMARY_INPUT_MESSAGE_CHARS = 2_000
const MAX_MEMORY_SUMMARY_CHARS = 3_000

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
			const compactCurrentSummary = summarizedMessages
				? this.truncateText(summarizedMessages, MAX_MEMORY_SUMMARY_CHARS)
				: null
			const messagesToSummarize = messages
				.slice(0, -this.LAST_SAVED_MESSAGES_COUNT)
				.map((message) => this.truncateMessage(message, MAX_SUMMARY_INPUT_MESSAGE_CHARS))
			const summary = await this.summaryService.generateSummary(
				compactCurrentSummary,
				messagesToSummarize
			)
			await this.summaryRepository.addSummary(sessionId, summary)
			await this.messageRepository.trim(sessionId, this.LAST_SAVED_MESSAGES_COUNT)
		}
	}

	async clearConversationContext(sessionId: string): Promise<void> {
		await this.messageRepository.trim(sessionId, 0)
		await this.summaryRepository.clear(sessionId)
	}

	async getConversationContext(sessionId: string): Promise<IChatMessage[]> {
		const messages = await this.messageRepository.getMessages(sessionId)
		const summary = await this.summaryRepository.getSummary(sessionId)
		const compactSummary = summary
			? this.truncateText(summary, MAX_MEMORY_SUMMARY_CHARS)
			: null
		const compactMessages = messages.map((message) =>
			this.truncateMessage(message, MAX_MEMORY_MESSAGE_CHARS)
		)

		return [
			...(compactSummary
				? [
						{
							role: "system",
							content: `Conversation summary:\n${compactSummary}`
						} as IChatMessage
					]
				: []),
			...compactMessages
		]
	}

	private truncateMessage(message: IChatMessage, maxChars: number): IChatMessage {
		if (message.content.length <= maxChars) {
			return message
		}

		return {
			...message,
			content: this.truncateText(message.content, maxChars)
		}
	}

	private truncateText(content: string, maxChars: number): string {
		if (content.length <= maxChars) {
			return content
		}

		return `${content.slice(0, maxChars)}

[Text truncated: ${content.length - maxChars} characters omitted]`
	}
}
