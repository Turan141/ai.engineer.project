export interface IDocumentOcrResult {
	text: string
}

export interface IDocumentOcrEntry {
	id: string
	fileName: string
	fileSize: number
	mimeType: string
	text: string
	createdAt: Date
}