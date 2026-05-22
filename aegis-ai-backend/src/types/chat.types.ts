export type ChatMessageRole = "user" | "assistant" | "system"

export interface IChatRequest {
	message: string
}

export interface IChatResponse {
	message: IChatMessage
}

export interface IChatMessage {
	role: ChatMessageRole
	content: string
}
