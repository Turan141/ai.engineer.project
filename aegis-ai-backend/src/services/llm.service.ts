import type { IChatMessage, IGenerateParams } from "../types/chat.types.js"
import { geminiService } from "./gemini.service.js"

const CURRENT_PROVIDER = geminiService

export class LLMService {
	async generate(params: IGenerateParams): Promise<IChatMessage> {
		const aiResponse = await CURRENT_PROVIDER.generate(params)

		return { role: "assistant", content: aiResponse }
	}

	async generateStream(params: IGenerateParams) {
		return CURRENT_PROVIDER.generateStream(params)
	}
}

export const llmService = new LLMService()
