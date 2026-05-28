export interface IDocumentAnalysisResult {
	documentType: string
	summary: string
	keywords: string[]
	entities: Record<string, string>
}

export interface IDocumentProcessResult {
	rawText: string
	analysis: IDocumentAnalysisResult
}

export interface IDocumentProcessEntry {
	id: string
	fileName: string
	fileSize: number
	mimeType: string
	rawText: string
	analysis: IDocumentAnalysisResult
	createdAt: Date
}
