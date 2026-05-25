export interface IDocument {
	id: string
	content: string
	source: string
}

export interface IChunk {
	id: string
	content: string
	source: string
	chunkIndex: number
}

export interface IDocumentLoader {
	loadDocuments(path: string): Promise<IDocument[]>
}

export interface ITextSplitter {
	split(document: IDocument): IChunk[]
}

export interface ITextSplitter {}
