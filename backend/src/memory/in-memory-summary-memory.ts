import type { ISummaryMemory } from "./types.js"

export class InMemorySummaryMemory implements ISummaryMemory {
	private readonly summaries: Map<string, string> = new Map()

	addSummary(sessionId: string, summary: string): Promise<void> {
		this.summaries.set(sessionId, summary)
		return Promise.resolve()
	}
	clear(sessionId: string): Promise<void> {
		this.summaries.delete(sessionId)
		return Promise.resolve()
	}
	async getSummary(sessionId: string): Promise<string | null> {
		return this.summaries.get(sessionId) || null
	}
}
