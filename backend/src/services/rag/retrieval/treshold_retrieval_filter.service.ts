import type { IRetrievalStrategy, ISearchResult } from "../../../types/chat.types.js"

export class ThresholdRetrievalFilter implements IRetrievalStrategy {
	constructor(private readonly threshold: number) {}

	filter(results: ISearchResult[]): ISearchResult[] {
		return results.filter((result) => result.score >= this.threshold)
	}
}
