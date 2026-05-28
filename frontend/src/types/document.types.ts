export interface IDocumentProcessResult {
	text: string
	analysis: string
}

export interface IDocumentProcessEntry {
	id: string
	fileName: string
	fileSize: number
	mimeType: string
	text: string
	analysis: string
	createdAt: Date
}
