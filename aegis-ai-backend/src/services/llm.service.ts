import type { IChatMessage, IGenerateParams } from "../types/chat.types.js"

export class LLMService {
	async generate(params: IGenerateParams): Promise<IChatMessage> {
		return { role: "assistant", content: params.message }
	}
}

export const llmService = new LLMService()
