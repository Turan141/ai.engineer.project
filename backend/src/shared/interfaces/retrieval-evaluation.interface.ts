import type { ISearchResult } from "./vector-store.interface.js"

export interface IRetrievalTestCase {
	query: string
	expectedChunkIds: string[]
}

export interface IEvaluationResult {
	query: string
	recallAtK: number
	precisionAtK: number
	foundChunkIds: string[]
	expectedChunkIds: string[]
	foundChunks: ISearchResult[]
}
