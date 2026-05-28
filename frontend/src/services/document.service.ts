import type { IDocumentOcrResult } from "../types/document.types"

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

export async function extractDocumentText(
	file: File,
	signal?: AbortSignal
): Promise<IDocumentOcrResult> {
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

	const data = (await res.json()) as { text?: unknown }
	if (typeof data.text !== "string") {
		throw new Error("OCR response did not include extracted text")
	}

	return {
		text: data.text
	}
}