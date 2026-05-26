export interface IEmbeddingResponse {
	data: Array<{
		embedding: number[]
	}>
}

export interface IEmbeddingProvider {
	generateEmbedding(text: string, signal?: AbortSignal): Promise<number[]>
}
