export function cosineSimilarity(a: number[], b: number[]): number {
	if (!a || !b) {
		throw new Error("Input vectors cannot be null or undefined")
	}

	if (!a.length || !b.length) {
		throw new Error("Input vectors cannot be empty")
	}

	if (a.length !== b.length) {
		throw new Error("Vectors must be of the same length")
	}

	const dotProduct = a.reduce(
		(sum, currentValue, i) => sum + currentValue * (b[i] || 0),
		0
	)

	const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
	const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

	if (magnitudeA === 0 || magnitudeB === 0) {
		return 0
	}

	return dotProduct / (magnitudeA * magnitudeB)
}
