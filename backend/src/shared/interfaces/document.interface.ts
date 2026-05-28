export interface IDocumentAnalysisResult {
	text: string
	analysis: string
}
export interface IDocumentOCRResult {
	text: string
}

export interface IDocumentAnalysisService {
	analyzeDocument(text: string): Promise<{ content: string }>
}

export interface IDocumentOCRService {
	extractText(filePath: string): Promise<string>
}
