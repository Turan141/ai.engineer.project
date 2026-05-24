import { IChatMessage } from "../types/chat.types"

type OnChunk = (text: string) => void

interface StreamOptions {
	messages: IChatMessage[]
	onChunk: OnChunk
	signal?: AbortSignal
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ""

export async function streamChat({
	messages,
	onChunk,
	signal
}: StreamOptions): Promise<void> {
	const res = await fetch(`${API_BASE}/api/chat/stream`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ messages }),
		signal,
		keepalive: true,
		cache: "no-cache"
	})

	if (!res.ok) {
		throw new Error(`Network error: ${res.status} ${res.statusText}`)
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
