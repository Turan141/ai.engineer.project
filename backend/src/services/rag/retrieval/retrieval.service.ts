import type { IRetrievalStrategy, ISearchResult } from "../../../types/chat.types.js"
import { ThresholdRetrievalFilter } from "./treshold_retrieval_filter.service.js"

const DEFAULT_TRESHOLD = 0.7

const retrievalFilterServices = {
	tresholdFilter: new ThresholdRetrievalFilter(DEFAULT_TRESHOLD)
}

export class RetrievalService implements IRetrievalStrategy {
	constructor() {}
	filter(results: ISearchResult[]): ISearchResult[] {
		return retrievalFilterServices.tresholdFilter.filter(results)
	}
}
