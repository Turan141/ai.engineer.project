// src/memory/types.ts

import type { IChatMessage } from "../../types/chat.types.js"

export interface ISummaryService {
	generateSummary(
		currentSummary: string | null,
		messages: IChatMessage[]
	): Promise<string>
}

export interface IConversationMemory {
	addMessage(sessionId: string, message: IChatMessage): Promise<void>
	getMessages(sessionId: string): Promise<IChatMessage[]>
	trim(sessionId: string, lastSavedMsgCount: number): Promise<void>
}
export interface ISummaryMemory {
	addSummary(sessionId: string, summary: string): Promise<void>
	getSummary(sessionId: string): Promise<string | null>
	clear(sessionId: string): Promise<void>
}
