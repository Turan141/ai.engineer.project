import React, { useEffect, useRef, useState } from "react"
import { IChatMessage } from "../types/chat.types"
import { streamChat } from "../services/chat.service"

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

	const handleSend = async () => {
		const trimmed = input.trim()

		if (!trimmed || isLoading) {
			return
		}

		const userMessage: IChatMessage = {
			role: "user",
			content: trimmed
		}

		setMessages((prev) => [
			...prev,
			userMessage,
			{
				role: "assistant",
				content: ""
			}
		])

		setInput("")
		setIsLoading(true)

		const controller = new AbortController()
		controllerRef.current = controller
		const start = Date.now()

		try {
			await streamChat({
				messages: [userMessage],
				signal: controller.signal,

				onChunk: (text) => {
					setMessages((prev) => {
						if (prev.length === 0) {
							return prev
						}

						const next = [...prev]
						const lastIndex = next.length - 1

						next[lastIndex] = {
							...next[lastIndex],
							content: next[lastIndex].content + text
						}

						return next
					})
				}
			})
		} catch (err: any) {
			if (err?.name !== "AbortError") {
				console.error(err)

				setMessages((prev) => {
					if (prev.length === 0) {
						return prev
					}

					const next = [...prev]
					const lastIndex = next.length - 1

					next[lastIndex] = {
						...next[lastIndex],
						content: next[lastIndex].content + "\n[Error streaming response]"
					}

					return next
				})
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
		<div className='chat-shell'>
			<section className='chat-panel'>
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Streaming chat</h1>
						<p>Аккуратный интерфейс без серых коробок и визуального шума.</p>
					</div>
					<div className={`chat-status ${isLoading ? "is-live" : ""}`}>
						<span className='chat-status__dot' />
						{isLoading ? "Generating" : "Ready"}
					</div>
				</header>

				<div className='chat-thread' ref={messagesRef}>
					{messages.length === 0 && (
						<div className='chat-empty'>
							<div className='chat-empty__badge'>Start here</div>
							<h2>Задай вопрос модели</h2>
							<p>
								Например: попроси объяснить баг, переписать код или помочь с архитектурой.
							</p>
						</div>
					)}
					{messages.map((m, i) => (
						<div key={i} className={`chat-message chat-message--${m.role}`}>
							<div className='chat-message__meta'>
								{m.role === "assistant" ? "Assistant" : "You"}
							</div>
							<div className='chat-message__bubble'>{m.content}</div>
						</div>
					))}
				</div>

				<div className='chat-composer'>
					<div className='chat-composer__topline'>
						<div>
							<div className='chat-composer__title'>Your prompt</div>
							<div className='chat-composer__hint'>
								Ответ придёт потоком сразу по мере генерации.
							</div>
						</div>
						<div className='chat-composer__count'>{input.trim().length} chars</div>
					</div>

					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						rows={4}
						className='chat-input'
						placeholder='Type your message...'
						disabled={isLoading}
					/>

					<div className='chat-actions'>
						<button
							onClick={handleSend}
							disabled={isLoading || input.trim() === ""}
							className='chat-button chat-button--primary'
						>
							Send
						</button>
						<button
							onClick={handleStop}
							disabled={!isLoading}
							className='chat-button chat-button--ghost'
						>
							Stop
						</button>
					</div>
				</div>
			</section>
		</div>
	)
}

export default Chat
