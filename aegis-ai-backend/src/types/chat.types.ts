export type TChatMessageRole = "user" | "assistant" | "system"

export interface IChatRequest {
	message: string
}

export interface IChatResponse {
	message: IChatMessage
}

export interface IChatMessage {
	role: TChatMessageRole
	content: string
}

export interface IGenerateParams {
	message: string
}
