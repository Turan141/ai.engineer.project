import type { IGenerateImageRequest, IGenerateImageResponse } from "../types/image.types"

const API_BASE = "https://dh141.tail0c91e0.ts.net"

export async function generateImage(
	params: IGenerateImageRequest,
	signal?: AbortSignal
): Promise<IGenerateImageResponse> {
	const res = await fetch(`${API_BASE}/image/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
		signal
	})

	if (!res.ok) {
		let message = `${res.status} ${res.statusText}`
		try {
			const data = (await res.json()) as { error?: string }
			if (data?.error) message = data.error
		} catch {
			// ignore
		}
		throw new Error(message)
	}

	return res.json() as Promise<IGenerateImageResponse>
}
