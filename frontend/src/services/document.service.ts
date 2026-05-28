import type { IDocumentProcessResult } from "../types/document.types"

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

function parseDocumentResponse(payload: unknown): IDocumentProcessResult {
	if (!payload || typeof payload !== "object") {
		throw new Error("Document response has invalid format")
	}

	const response = payload as {
		text?: unknown
		analysis?: unknown
	}

	if (typeof response.text === "string") {
		return {
			text: response.text,
			analysis: typeof response.analysis === "string" ? response.analysis : ""
		}
	}

	if (response.text && typeof response.text === "object") {
		const nested = response.text as {
			text?: unknown
			analysis?: unknown
		}

		if (typeof nested.text === "string") {
			return {
				text: nested.text,
				analysis:
					typeof nested.analysis === "string"
						? nested.analysis
						: typeof response.analysis === "string"
							? response.analysis
							: ""
			}
		}
	}

	throw new Error("Document response did not include extracted text")
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
