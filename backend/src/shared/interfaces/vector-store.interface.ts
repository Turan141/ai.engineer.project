export interface IVectorDocument {
	id: string
	content: string
	embedding: number[]
	source: string
	metadata: {
		title: string
		chunkIndex: number
	}
}

export interface ISearchResult {
	document: IVectorDocument
	score: number
}

export interface IRAGResponse {
	answer: string
	context: ISearchResult[]
	sources: string[]
}

export interface IVectorStore {
	addDocument(document: IVectorDocument): Promise<void>
	search(embedding: string, topK?: number): Promise<ISearchResult[]>
	clearAllKnowledge(): Promise<void>
}
