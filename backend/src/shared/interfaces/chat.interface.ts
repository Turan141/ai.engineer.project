export type TChatMessageRole = "user" | "assistant" | "system"

export interface IChatMessage {
	role: TChatMessageRole
	content: string
}

export interface IChatHistoryResponse {
	sessionId: string
	summary: string | null
	messages: IChatMessage[]
}
