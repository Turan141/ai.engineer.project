import { IChatMessage } from "../types/chat.types"

type OnChunk = (text: string) => void

interface JsonRequestOptions {
	path: string
	body: unknown
	signal?: AbortSignal
}

interface ChatOptions {
	messages: IChatMessage[]
	signal?: AbortSignal
}

interface StreamOptions {
	sessionId: string
	message: string
	onChunk: OnChunk
	signal?: AbortSignal
}

// In development (VITE_API_BASE=http://localhost:3000) requests go straight to the
// backend — bypassing both Vite's proxy and the Tailscale HTTPS endpoint, both of
// which buffer SSE responses and break streaming.  Production keeps the full URL.
const API_BASE = import.meta.env.VITE_API_BASE ?? "https://dh141.tail0c91e0.ts.net"

async function getResponseErrorMessage(res: Response): Promise<string> {
	try {
		const payload = (await res.json()) as { error?: string }
		if (typeof payload?.error === "string" && payload.error.trim() !== "") {
			return payload.error
		}
	} catch (_error) {
		try {
			const text = await res.text()
			if (text.trim() !== "") {
				return text
			}
		} catch (_readError) {
			// Ignore body parsing errors and fall back to status text.
		}
	}

	return `Network error: ${res.status} ${res.statusText}`
}

async function postJson<T>({ path, body, signal }: JsonRequestOptions): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		signal
	})

	if (!res.ok) {
		throw new Error(await getResponseErrorMessage(res))
	}

	return res.json() as Promise<T>
}

export async function generateChat({
	messages,
	signal
}: ChatOptions): Promise<IChatMessage> {
	const response = await postJson<{ message: IChatMessage }>({
		path: "/api/chat",
		body: { messages },
		signal
	})

	return response.message
}

function isVisibleChatMessage(message: unknown): message is IChatMessage {
	if (!message || typeof message !== "object") {
		return false
	}

	const candidate = message as { role?: unknown; content?: unknown }

	return (
		(candidate.role === "user" || candidate.role === "assistant") &&
		typeof candidate.content === "string"
	)
}

export async function getChatHistory(
	sessionId: string,
	signal?: AbortSignal
): Promise<IChatMessage[]> {
	const res = await fetch(
		`${API_BASE}/api/chat/history/${encodeURIComponent(sessionId)}`,
		{
			signal
		}
	)

	if (!res.ok) {
		throw new Error(await getResponseErrorMessage(res))
	}

	const data = (await res.json()) as {
		history?: unknown[]
	}

	if (!Array.isArray(data.history)) {
		return []
	}

	return data.history.filter(isVisibleChatMessage)
}

export async function getDebugMessages(sessionId: string): Promise<IChatMessage[]> {
	const res = await fetch(
		`${API_BASE}/api/debug/messages/${encodeURIComponent(sessionId)}`
	)

	if (!res.ok) {
		throw new Error(await getResponseErrorMessage(res))
	}

	const data = (await res.json()) as { messages: IChatMessage[] }
	return data.messages
}

export async function generateEmbedding(
	text: string,
	signal?: AbortSignal
): Promise<number[]> {
	const response = await postJson<{ embedding: number[] }>({
		path: "/api/embeddings",
		body: { text },
		signal
	})

	return response.embedding
}

export async function streamChat({
	sessionId,
	message,
	onChunk,
	signal
}: StreamOptions): Promise<void> {
	const res = await fetch(`${API_BASE}/api/chat/stream`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
		body: JSON.stringify({ sessionId, message }),
		signal
	})

	if (!res.ok) {
		throw new Error(await getResponseErrorMessage(res))
	}

	if (!res.body) return

	const reader = res.body.getReader()
	const decoder = new TextDecoder()
	let buffer = ""

	try {
		while (true) {
			const { done, value } = await reader.read()

			if (done) break
			buffer += decoder.decode(value, { stream: true })

			let sepIndex: number
			while (
				(sepIndex = buffer.indexOf("\n\n")) !== -1 ||
				(sepIndex = buffer.indexOf("\r\n\r\n")) !== -1
			) {
				// Prefer the earliest separator
				const firstSep = (() => {
					const n2 = buffer.indexOf("\n\n")
					const r2 = buffer.indexOf("\r\n\r\n")
					if (n2 === -1) return r2
					if (r2 === -1) return n2
					return Math.min(n2, r2)
				})()

				const rawEvent = buffer.slice(0, firstSep)
				buffer = buffer.slice(firstSep + (buffer[firstSep] === "\r" ? 4 : 2))

				// Collect `data:` lines (may be multi-line per event).
				const lines = rawEvent.split(/\r?\n/)
				let data = ""
				for (const line of lines) {
					if (line.startsWith("data:")) {
						data += line.slice(5).trim()
					}
				}

				if (!data) continue
				if (data === "[DONE]") {
					return // stream finished
				}

				let parsed: any
				try {
					parsed = JSON.parse(data)
				} catch (err) {
					throw new Error(`Invalid JSON payload in SSE data: ${data}`)
				}

				if (parsed && typeof parsed.error === "string" && parsed.error.trim() !== "") {
					throw new Error(parsed.error)
				}

				if (parsed && typeof parsed.text === "string") {
					onChunk(parsed.text)
				}
			}
		}

		// If there's leftover buffer after the stream closed, try to parse it.
		if (buffer.trim()) {
			const lines = buffer.split(/\r?\n/)
			let data = ""
			for (const line of lines) {
				if (line.startsWith("data:")) data += line.slice(5).trim()
			}
			if (data && data !== "[DONE]") {
				let parsed: any
				try {
					parsed = JSON.parse(data)
				} catch (err) {
					throw new Error(`Invalid JSON payload in leftover SSE data: ${data}`)
				}
				if (parsed && typeof parsed.error === "string" && parsed.error.trim() !== "") {
					throw new Error(parsed.error)
				}
				if (parsed && typeof parsed.text === "string") {
					onChunk(parsed.text)
				}
			}
		}
	} finally {
		try {
			reader.cancel()
		} catch (_e) {
			// ignore
		}
	}
}

export default streamChat
