import type { IChunk, IDocument, ITextSplitter } from "../types.js"

export class RecursiveTextSplitter implements ITextSplitter {
	constructor(
		private readonly chunkSize: number = 500,
		private readonly chunkOverlap: number = 100,
		private readonly separators: string[] = ["\n\n", "\n", " ", ""]
	) {
		if (chunkOverlap >= chunkSize) {
			throw new Error("chunkOverlap must be smaller than chunkSize")
		}
	}

	public split(document: IDocument): IChunk[] {
		const chunks = this.splitRecursively(document.content, [...this.separators])

		return chunks.map((content, index) => ({
			id: `${document.id}_chunk_${index}`,
			content,
			source: document.source,
			chunkIndex: index
		}))
	}

	private splitTextToTexts(text: string): string[] {
		const chunks: string[] = []

		const step = this.chunkSize - this.chunkOverlap

		let position = 0

		while (position < text.length) {
			chunks.push(text.slice(position, position + this.chunkSize))

			position += step
		}

		return chunks
	}

	private splitRecursively(text: string, separators: string[]): string[] {
		if (text.length <= this.chunkSize) {
			return [text]
		}

		const separator = separators[0]

		if (separator === undefined) {
			return this.splitTextToTexts(text)
		}

		if (separator === "") {
			return this.splitTextToTexts(text)
		}

		const parts = text.split(separator).filter(Boolean)

		if (parts.length <= 1) {
			return this.splitRecursively(text, separators.slice(1))
		}

		const chunks: string[] = []

		let currentChunk = ""

		for (const part of parts) {
			if (part.length > this.chunkSize) {
				if (currentChunk.length > 0) {
					chunks.push(currentChunk)
					currentChunk = ""
				}

				chunks.push(...this.splitRecursively(part, separators.slice(1)))

				continue
			}

			const candidate = currentChunk.length > 0 ? currentChunk + separator + part : part

			if (candidate.length <= this.chunkSize) {
				currentChunk = candidate
			} else {
				if (currentChunk.length > 0) {
					chunks.push(currentChunk)
				}

				currentChunk = part
			}
		}

		if (currentChunk.length > 0) {
			chunks.push(currentChunk)
		}

		return chunks
	}
}
