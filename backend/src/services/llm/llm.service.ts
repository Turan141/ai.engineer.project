import { config } from "../../config/config.js"
import { createLogger } from "../../shared/logger.js"
import type {
	IChatMessage,
	IEmbeddingProvider,
	IGenerateParams,
	ILLMProvider
} from "../../types/chat.types.js"
import { LMStudioService } from "../../providers/llm/lmstudio.provider.js"
import { GeminiService } from "../../providers/llm/gemini.provider.js"
import { LMStudioEmbeddingService } from "../../providers/embedding/lmstudio.embedding.provider.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"

const log = createLogger("LLMService")

type TProviderName = "gemini" | "lmstudio"
type TEmbeddingProviderName = "lmstudio"

const embeddingProviders: Record<TEmbeddingProviderName, IEmbeddingProvider> = {
	lmstudio: new LMStudioEmbeddingService()
}

const providers: Record<TProviderName, ILLMProvider> = {
	gemini: new GeminiService(),
	lmstudio: new LMStudioService()
}

export class LLMService implements ILLMService {
	private currentProviderName: TProviderName
	private currentProvider: ILLMProvider
	private currentEmbeddingProviderName: TEmbeddingProviderName
	private currentEmbeddingProvider: IEmbeddingProvider

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
		const t0 = Date.now()
		log.info({ provider: this.currentProviderName }, "llm:generate")
		const aiResponse = await this.currentProvider.generate(params, signal)
		log.info({ provider: this.currentProviderName, durationMs: Date.now() - t0 }, "llm:generate:done")
		return { role: "assistant", content: aiResponse }
	}

	async generateStream(
		params: IGenerateParams,
		signal?: AbortSignal
	): Promise<AsyncIterable<{ text: string }>> {
		log.info({ provider: this.currentProviderName }, "llm:stream:start")
		return this.currentProvider.generateStream(params, signal)
	}
}
