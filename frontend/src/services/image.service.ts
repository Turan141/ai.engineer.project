import type { IGenerateImageRequest, IGenerateImageResponse } from "../types/image.types"

const API_BASE = "https://dh141.tail0c91e0.ts.net"

interface IGenerateImageApiResponse {
	id: string
	url?: string
}

async function getResponseErrorMessage(res: Response): Promise<string> {
	let message = `${res.status} ${res.statusText}`

	try {
		const data = (await res.json()) as { error?: string }
		if (typeof data?.error === "string" && data.error.trim() !== "") {
			message = data.error
		}
	} catch {
		// ignore body parsing errors and keep status message
	}

	return message
}

function buildImageUrlById(id: string): string {
	return `${API_BASE}/api/image/${encodeURIComponent(id)}`
}

export async function generateImage(
	params: IGenerateImageRequest,
	signal?: AbortSignal
): Promise<IGenerateImageResponse> {
	const res = await fetch(`${API_BASE}/api/image/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
		signal
	})

	if (!res.ok) {
		throw new Error(await getResponseErrorMessage(res))
	}

	const generated = (await res.json()) as IGenerateImageApiResponse
	if (typeof generated?.id !== "string" || generated.id.trim() === "") {
		throw new Error("Image ID is missing in generation response")
	}

	const resolvedUrl =
		typeof generated.url === "string" && generated.url.trim() !== ""
			? generated.url
			: buildImageUrlById(generated.id)

	return {
		id: generated.id,
		url: resolvedUrl
	}
}
