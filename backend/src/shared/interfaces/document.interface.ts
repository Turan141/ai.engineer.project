export interface IDocumentAnalysisResult {
	documentType: string
	summary: string
	keywords: string[]
	entities: Record<string, string>
}
export interface IDocumentOCRResult {
	text: string
}

export interface IDocumentAnalysisService {
	analyzeDocument(text: string): Promise<IDocumentAnalysisResult>
}

export interface IDocumentOCRService {
	extractText(filePath: string): Promise<string>
}
