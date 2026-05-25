import { config } from "../../config/config.js"
import type { IEmbeddingProvider, IEmbeddingResponse } from "../../types/chat.types.js"

export class LMStudioEmbeddingService implements IEmbeddingProvider {
	async generateEmbedding(text: string, signal?: AbortSignal): Promise<number[]> {
		const response = await fetch(`${config.lmstudioBaseUrl}/v1/embeddings`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ input: text, model: config.embeddingModel }),
			...(signal ? { signal } : {})
		})

		if (!response.ok) {
			throw new Error(`Failed to generate embedding: ${response.statusText}`)
		}

		const data = (await response.json()) as IEmbeddingResponse

		if (!data || !Array.isArray(data.data) || data.data.length === 0) {
			throw new Error("Invalid embedding response from LM Studio")
		}

		const embedding = data.data[0]?.embedding

		if (!Array.isArray(embedding)) {
			throw new Error("LM Studio returned invalid embedding")
		}

		return embedding
	}
}
