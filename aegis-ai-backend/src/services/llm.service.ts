export class LLMService {
	async generate(message: string): Promise<string> {
		return "Mock AI Response"
	}
}

export const llmService = new LLMService()
