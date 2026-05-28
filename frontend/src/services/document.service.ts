import type {
	IDocumentAnalysisResult,
	IDocumentProcessResult
} from "../types/document.types"

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://dh141.tail0c91e0.ts.net"

async function getResponseErrorMessage(res: Response): Promise<string> {
	try {
		const payload = (await res.json()) as { error?: string }
		if (typeof payload?.error === "string" && payload.error.trim() !== "") {
			return payload.error
		}
	} catch {
		try {
			const text = await res.text()
			if (text.trim() !== "") {
				return text
			}
		} catch {
			// Ignore response body parsing errors and fall back to status text.
		}
	}

	return `Network error: ${res.status} ${res.statusText}`
}

function normalizeAnalysisResult(payload: unknown): IDocumentAnalysisResult {
	if (!payload || typeof payload !== "object") {
		return {
			documentType: "",
			summary: "",
			keywords: [],
			entities: {}
		}
	}

	const response = payload as {
		documentType?: unknown
		summary?: unknown
		keywords?: unknown
		entities?: unknown
	}

	const keywords = Array.isArray(response.keywords)
		? response.keywords.filter((keyword): keyword is string => typeof keyword === "string")
		: []

	const entities =
		response.entities && typeof response.entities === "object"
			? Object.fromEntries(
					Object.entries(response.entities).filter(
						(entry): entry is [string, string] => typeof entry[1] === "string"
					)
				)
			: {}

	return {
		documentType:
			typeof response.documentType === "string" ? response.documentType : "",
		summary: typeof response.summary === "string" ? response.summary : "",
		keywords,
		entities
	}
}

function parseDocumentResponse(payload: unknown): IDocumentProcessResult {
	if (!payload || typeof payload !== "object") {
		throw new Error("Document response has invalid format")
	}

	const response = payload as {
		rawText?: unknown
		text?: unknown
		analysis?: unknown
	}

	if (typeof response.rawText === "string") {
		return {
			rawText: response.rawText,
			analysis: normalizeAnalysisResult(response.analysis)
		}
	}

	if (typeof response.text === "string") {
		return {
			rawText: response.text,
			analysis: normalizeAnalysisResult(response.analysis)
		}
	}

	if (response.text && typeof response.text === "object") {
		return parseDocumentResponse(response.text)
	}

	throw new Error("Document response did not include OCR text")
}

export async function processDocument(
	file: File,
	signal?: AbortSignal
): Promise<IDocumentProcessResult> {
	const formData = new FormData()
	formData.append("file", file)

	const res = await fetch(`${API_BASE}/api/document/ocr`, {
		method: "POST",
		body: formData,
		signal
	})

	if (!res.ok) {
		throw new Error(await getResponseErrorMessage(res))
	}

	return parseDocumentResponse(await res.json())
}

export const extractDocumentText = processDocument
