import React, { useEffect, useRef, useState } from "react"
import { IChatMessage } from "../types/chat.types"
import streamChat from "../services/chat.service"

const containerStyle: React.CSSProperties = {
	maxWidth: 720,
	margin: "24px auto",
	padding: 12,
	border: "1px solid #e5e7eb",
	borderRadius: 8,
	fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif"
}

const messagesStyle: React.CSSProperties = {
	minHeight: 240,
	maxHeight: 480,
	overflow: "auto",
	padding: 8,
	background: "#fafafa",
	borderRadius: 6,
	marginBottom: 12
}

export const Chat: React.FC = () => {
	const [messages, setMessages] = useState<IChatMessage[]>([])
	const [input, setInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const controllerRef = useRef<AbortController | null>(null)
	const messagesRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		return () => {
			// Cleanup any in-flight request on unmount
			controllerRef.current?.abort()
			controllerRef.current = null
		}
	}, [])

	useEffect(() => {
		// Auto-scroll to bottom when messages change
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight
		}
	}, [messages])

	const appendToLastAssistant = (text: string) => {
		setMessages((prev) => {
			if (prev.length === 0) return prev
			// Find last assistant message from the end
			const idx = (() => {
				for (let i = prev.length - 1; i >= 0; i--)
					if (prev[i].role === "assistant") return i
				return -1
			})()
			if (idx === -1) return prev
			const next = prev.slice()
			next[idx] = { ...next[idx], content: next[idx].content + text }
			return next
		})
	}

	const handleSend = async () => {
		const trimmed = input.trim()
		if (!trimmed || isLoading) return

		const userMessage: IChatMessage = { role: "user", content: trimmed }

		// Add user message and an empty assistant message placeholder
		setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }])
		setInput("")
		setIsLoading(true)

		const controller = new AbortController()
		controllerRef.current = controller

		try {
			await streamChat({
				messages: [userMessage],
				onChunk: appendToLastAssistant,
				signal: controller.signal
			})
		} catch (err: any) {
			if (err?.name === "AbortError") {
				// aborted by user, leave assistant partial text as-is
			} else {
				console.error(err)
				// Append error text to assistant message
				appendToLastAssistant("\n[Error streaming response]")
			}
		} finally {
			setIsLoading(false)
			controllerRef.current = null
		}
	}

	const handleStop = () => {
		if (controllerRef.current) {
			controllerRef.current.abort()
			controllerRef.current = null
			setIsLoading(false)
		}
	}

	return (
		<div style={containerStyle}>
			<h3>Chat (streaming test)</h3>
			<div style={messagesStyle} ref={messagesRef}>
				{messages.length === 0 && (
					<div style={{ color: "#6b7280" }}>No messages yet — say hi!</div>
				)}
				{messages.map((m, i) => (
					<div key={i} style={{ marginBottom: 8 }}>
						<div style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>
							{m.role}
						</div>
						<div
							style={{
								whiteSpace: "pre-wrap",
								background: m.role === "assistant" ? "#fff" : "#f3f4f6",
								padding: 8,
								borderRadius: 6
							}}
						>
							{m.content}
						</div>
					</div>
				))}
			</div>

			<div>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					rows={4}
					style={{
						width: "100%",
						padding: 8,
						borderRadius: 6,
						border: "1px solid #e5e7eb",
						resize: "vertical"
					}}
					placeholder='Type your message...'
					disabled={isLoading}
				/>
			</div>

			<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
				<button
					onClick={handleSend}
					disabled={isLoading || input.trim() === ""}
					style={{ padding: "8px 12px" }}
				>
					Send
				</button>
				<button
					onClick={handleStop}
					disabled={!isLoading}
					style={{ padding: "8px 12px" }}
				>
					Stop
				</button>
			</div>
		</div>
	)
}

export default Chat
