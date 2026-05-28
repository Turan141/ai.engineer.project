import type { IChatMessage, TChatMessageRole } from "./chat.interface.js"

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
