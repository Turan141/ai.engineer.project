import type { ISearchResult } from "./vector-store.interface.js"

export interface IRetrievalStrategy {
	filter(results: ISearchResult[]): ISearchResult[]
}
