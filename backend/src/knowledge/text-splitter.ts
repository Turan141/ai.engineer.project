import type { IDocument, IChunk } from "./types.js"

export class CharacterTextSplitter {
	constructor(
		private readonly chunkSize: number = 500,
		private readonly chunkOverlap: number = 100
	) {
		if (chunkSize <= 0) {
			throw new Error("chunkSize must be greater than 0")
		}

		if (chunkOverlap >= chunkSize) {
			throw new Error("chunkOverlap must be smaller than chunkSize")
		}
	}

	split(document: IDocument): IChunk[] {
		const chunks: IChunk[] = []

		const step = this.chunkSize - this.chunkOverlap

		let position = 0

		while (position < document.content.length) {
			chunks.push({
				id: `${document.id}-${chunks.length}`,
				content: document.content.slice(position, position + this.chunkSize),
				source: document.source
			})

			position += step
		}

		return chunks
	}
}
