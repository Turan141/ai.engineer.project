import type { IChatMessage, TChatMessageRole } from "./chat.interface.js"

export interface IGenerateParams {
	messages: IChatMessage[]
}

export interface ILLMService {
	setProvider(name: string): void

	getProviderName(): string

	getAvailableProviders(): string[]

	generate(params: IGenerateParams, signal?: AbortSignal): Promise<IChatMessage>

	generateStream(
		params: IGenerateParams,
		signal?: AbortSignal
	): Promise<AsyncIterable<{ text: string }>>

	generateEmbedding(text: string, signal?: AbortSignal): Promise<number[]>

	setEmbeddingProvider(name: string): void
}

export interface ILLMProvider {
	generate(params: IGenerateParams, signal?: AbortSignal): Promise<string>
	generateStream(
		params: IGenerateParams,
		signal?: AbortSignal
	): AsyncIterable<{ text: string }>
}

export interface ILMStudioMessage {
	role: TChatMessageRole
	content: string
}

export interface ILMStudioChoice {
	message: ILMStudioMessage
}

export interface ILMStudioResponse {
	choices: ILMStudioChoice[]
}

export interface ILMStudioDelta {
	content?: string
}

export interface ILMStudioStreamChoice {
	delta: ILMStudioDelta
}

export interface ILMStudioStreamResponse {
	choices: ILMStudioStreamChoice[]
}
