// src/memory/types.ts

import type { IChatMessage } from "../types/chat.types.js"

export interface IConversationMemory {
	addMessage(sessionId: string, message: IChatMessage): Promise<void>

	getMessages(sessionId: string): Promise<IChatMessage[]>

	clear(sessionId: string): Promise<void>
}
