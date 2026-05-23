import { config } from "../config/config.js"
import type { IChatMessage, IGenerateParams, ILLMProvider } from "../types/chat.types.js"
import { GeminiService } from "./gemini.service.js"
import { LMStudioService } from "./lmstudio.service.js"

type TProviderName = "gemini" | "lmstudio"

const providers: Record<TProviderName, ILLMProvider> = {
	gemini: new GeminiService(),
	lmstudio: new LMStudioService()
}

export class LLMService {
	private currentProviderName: TProviderName
	private currentProvider: ILLMProvider

	constructor() {
		const defaultName: TProviderName = config.defaultProvider as TProviderName

		if (!providers[defaultName]) {
			throw new Error(`Unknown LLM provider: ${defaultName}`)
		}

		this.currentProviderName = defaultName
		this.currentProvider = providers[defaultName]
	}

	setProvider(name: string): void {
		if (!providers[name as TProviderName]) {
			throw new Error(
				`Unknown LLM provider: ${name}. Available: ${Object.keys(providers).join(", ")}`
			)
		}
		this.currentProviderName = name as TProviderName
		this.currentProvider = providers[name as TProviderName]
	}

	getProviderName(): string {
		return this.currentProviderName
	}

	getAvailableProviders(): string[] {
		return Object.keys(providers)
	}

	async generate(params: IGenerateParams, signal?: AbortSignal): Promise<IChatMessage> {
		const aiResponse = await this.currentProvider.generate(params, signal)

		return { role: "assistant", content: aiResponse }
	}

	async generateStream(
		params: IGenerateParams,
		signal?: AbortSignal
	): Promise<AsyncIterable<{ text: string }>> {
		return this.currentProvider.generateStream(params, signal)
	}
}

export const llmService = new LLMService()
