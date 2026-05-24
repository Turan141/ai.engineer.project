import { config } from "../config/config.js"
import type { IChatMessage, IGenerateParams, ILLMProvider } from "../types/chat.types.js"
import { GeminiService } from "./gemini.service.js"
import { LMStudioService } from "./lmstudio.service.js"
import { LMStudioEmbeddingService } from "./lmstudio.embedding.service.ts.js"

type TProviderName = "gemini" | "lmstudio"
type TEmbeddingProviderName = "lmstudio"

const embeddingProviders: Record<TEmbeddingProviderName, LMStudioEmbeddingService> = {
	lmstudio: new LMStudioEmbeddingService()
}

const providers: Record<TProviderName, ILLMProvider> = {
	gemini: new GeminiService(),
	lmstudio: new LMStudioService()
}

export class LLMService {
	private currentProviderName: TProviderName
	private currentProvider: ILLMProvider
	private currentEmbeddingProviderName: TEmbeddingProviderName
	private currentEmbeddingProvider: LMStudioEmbeddingService

	constructor() {
		const defaultName: TProviderName = config.defaultProvider as TProviderName
		const defaultEmbeddingProviderName: TEmbeddingProviderName = "lmstudio"

		if (!providers[defaultName]) {
			throw new Error(`Unknown LLM provider: ${defaultName}`)
		}

		this.currentProviderName = defaultName
		this.currentProvider = providers[defaultName]
		this.currentEmbeddingProviderName = defaultEmbeddingProviderName
		this.currentEmbeddingProvider = embeddingProviders[this.currentEmbeddingProviderName]
	}

	setEmbeddingProvider(name: string): void {
		if (!embeddingProviders[name as TEmbeddingProviderName]) {
			throw new Error(`Unknown embedding provider: ${name}`)
		}
		this.currentEmbeddingProviderName = name as TEmbeddingProviderName
		this.currentEmbeddingProvider = embeddingProviders[name as TEmbeddingProviderName]
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

	async generateEmbedding(text: string, signal?: AbortSignal): Promise<number[]> {
		return this.currentEmbeddingProvider.generateEmbedding(text, signal)
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
