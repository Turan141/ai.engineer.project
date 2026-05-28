const API_BASE = import.meta.env.VITE_API_BASE ?? "https://dh141.tail0c91e0.ts.net"

export interface IKnowledgeUploadResult {
	success: boolean
	message: string
}

async function getResponseErrorMessage(res: Response): Promise<string> {
	try {
		const payload = (await res.json()) as { error?: string }
		if (typeof payload?.error === "string" && payload.error.trim() !== "") {
			return payload.error
		}
	} catch {
		/* ignore */
	}
	return `Network error: ${res.status} ${res.statusText}`
}

export async function uploadToKnowledgeBase(
	file: File,
	signal?: AbortSignal
): Promise<IKnowledgeUploadResult> {
	const formData = new FormData()
	formData.append("file", file)

	const res = await fetch(`${API_BASE}/api/document/uploadKnowledge`, {
		method: "POST",
		body: formData,
		signal
	})

	if (!res.ok) {
		const msg = await getResponseErrorMessage(res)
		throw new Error(msg)
	}

	return res.json() as Promise<IKnowledgeUploadResult>
}
