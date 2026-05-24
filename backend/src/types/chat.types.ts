export type TChatMessageRole = "user" | "assistant" | "system"

export interface IChatRequest {
	messages: IChatMessage[]
}

export interface IChatResponse {
	messages: IChatMessage[]
}

export interface IChatMessage {
	role: TChatMessageRole
	content: string
}

export interface IGenerateParams {
	messages: IChatMessage[]
}

export interface ILLMProvider {
	generate(params: IGenerateParams, signal?: AbortSignal): Promise<string>
	generateStream(
		params: IGenerateParams,
		signal?: AbortSignal
	): AsyncIterable<{ text: string }>
}

export interface ILMStudioResponse {
	choices: ILMStudioChoice[]
}

export interface ILMStudioChoice {
	message: ILMStudioMessage
}

export interface ILMStudioMessage {
	role: TChatMessageRole
	content: string
}

export interface ILMStudioStreamResponse {
	choices: ILMStudioStreamChoice[]
}

export interface ILMStudioStreamChoice {
	delta: ILMStudioDelta
}

export interface ILMStudioDelta {
	content?: string
}

export interface IEmbeddingProvider {
	generateEmbedding(text: string): Promise<number[]>
}

export interface IEmbeddingResponse {
	data: Array<{
		embedding: number[]
	}>
}

export interface IEmbeddingProvider {
	generateEmbedding(text: string, signal?: AbortSignal): Promise<number[]>
}

export interface IVectorDocument {
	id: string
	content: string
	embedding?: number[]
	source?: string
}

export interface ISearchResult {
	document: IVectorDocument
	score: number
}

export interface IRAGResponse {
	answer: string
	context: ISearchResult[]
}
