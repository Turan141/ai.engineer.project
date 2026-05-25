import React, { useEffect, useRef, useState } from "react"
import { IChatMessage } from "../types/chat.types"
import { generateChat, generateEmbedding, streamChat } from "../services/chat.service"

type TChatMode = "stream" | "single"

interface IEmbeddingPreview {
	text: string
	values: number[]
}

const EMBEDDING_PREVIEW_SIZE = 8

function updateLastAssistantMessage(
	messages: IChatMessage[],
	updater: (message: IChatMessage) => IChatMessage
): IChatMessage[] {
	if (messages.length === 0) {
		return messages
	}

	const next = [...messages]
	const lastIndex = next.length - 1
	const lastMessage = next[lastIndex]

	if (lastMessage.role !== "assistant") {
		return messages
	}

	next[lastIndex] = updater(lastMessage)
	return next
}

function removeEmptyAssistantMessage(messages: IChatMessage[]): IChatMessage[] {
	const lastMessage = messages[messages.length - 1]

	if (!lastMessage) {
		return messages
	}

	if (lastMessage.role === "assistant" && lastMessage.content === "") {
		return messages.slice(0, -1)
	}

	return messages
}

export const Chat: React.FC = () => {
	const [messages, setMessages] = useState<IChatMessage[]>([])
	const [input, setInput] = useState("")
	const [mode, setMode] = useState<TChatMode>("stream")
	const [isLoading, setIsLoading] = useState(false)
	const [isEmbeddingLoading, setIsEmbeddingLoading] = useState(false)
	const [embeddingPreview, setEmbeddingPreview] = useState<IEmbeddingPreview | null>(null)
	const controllerRef = useRef<AbortController | null>(null)
	const embeddingControllerRef = useRef<AbortController | null>(null)
	const messagesRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		return () => {
			// Cleanup any in-flight request on unmount
			controllerRef.current?.abort()
			controllerRef.current = null
			embeddingControllerRef.current?.abort()
			embeddingControllerRef.current = null
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
		const conversation = [...messages, userMessage]

		setMessages([
			...conversation,
			{
				role: "assistant",
				content: ""
			}
		])

		setInput("")
		setIsLoading(true)

		const controller = new AbortController()
		controllerRef.current = controller

		try {
			if (mode === "single") {
				const assistantMessage = await generateChat({
					messages: conversation,
					signal: controller.signal
				})

				setMessages((prev) => updateLastAssistantMessage(prev, () => assistantMessage))
			} else {
				await streamChat({
					messages: conversation,
					signal: controller.signal,
					onChunk: (text) => {
						setMessages((prev) =>
							updateLastAssistantMessage(prev, (message) => ({
								...message,
								content: message.content + text
							}))
						)
					}
				})
			}
		} catch (err: any) {
			if (err?.name === "AbortError") {
				setMessages((prev) => removeEmptyAssistantMessage(prev))
			} else {
				console.error(err)

				setMessages((prev) =>
					updateLastAssistantMessage(prev, (message) => ({
						...message,
						content: message.content
							? `${message.content}\n[Error requesting response]`
							: "[Error requesting response]"
					}))
				)
			}
		} finally {
			setIsLoading(false)
			controllerRef.current = null
		}
	}

	const handleGenerateEmbedding = async () => {
		const trimmed = input.trim()

		if (!trimmed || isEmbeddingLoading) {
			return
		}

		embeddingControllerRef.current?.abort()
		const controller = new AbortController()
		embeddingControllerRef.current = controller
		setIsEmbeddingLoading(true)

		try {
			const embedding = await generateEmbedding(trimmed, controller.signal)
			setEmbeddingPreview({
				text: trimmed,
				values: embedding
			})
		} catch (err: any) {
			if (err?.name !== "AbortError") {
				console.error(err)
			}
		} finally {
			setIsEmbeddingLoading(false)
			if (embeddingControllerRef.current === controller) {
				embeddingControllerRef.current = null
			}
		}
	}

	const handleStop = () => {
		if (controllerRef.current) {
			controllerRef.current.abort()
			controllerRef.current = null
			setIsLoading(false)
		}
	}

	const statusLabel = isLoading ? "Generating" : isEmbeddingLoading ? "Embedding" : "Ready"

	return (
		<div className='chat-shell'>
			<section className='chat-panel'>
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Chat workbench</h1>
						<p>Обычный chat, streaming chat и embeddings доступны из одного интерфейса.</p>
					</div>
					<div className={`chat-status ${isLoading || isEmbeddingLoading ? "is-live" : ""}`}>
						<span className='chat-status__dot' />
						{statusLabel}
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
								{mode === "stream"
									? "Ответ придёт потоком сразу по мере генерации."
									: "Ответ вернётся одним сообщением через стандартный chat endpoint."}
							</div>
						</div>
						<div className='chat-composer__count'>{input.trim().length} chars</div>
					</div>

					<div className='chat-tools'>
						<div className='chat-mode-switch' aria-label='Chat mode switch'>
							<button
								type='button'
								onClick={() => setMode("stream")}
								className={`chat-pill ${mode === "stream" ? "is-active" : ""}`}
								disabled={isLoading}
							>
								Stream /chat/stream
							</button>
							<button
								type='button'
								onClick={() => setMode("single")}
								className={`chat-pill ${mode === "single" ? "is-active" : ""}`}
								disabled={isLoading}
							>
								Single /chat
							</button>
						</div>
						<button
							type='button'
							onClick={handleGenerateEmbedding}
							disabled={input.trim() === "" || isEmbeddingLoading}
							className='chat-button chat-button--ghost chat-button--compact'
						>
							{isEmbeddingLoading ? "Embedding..." : "Generate /embeddings"}
						</button>
					</div>

					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						rows={4}
						className='chat-input'
						placeholder='Type your message...'
						disabled={isLoading}
					/>

					{embeddingPreview && (
						<div className='embedding-card'>
							<div className='embedding-card__header'>
								<div>
									<div className='embedding-card__eyebrow'>Embedding preview</div>
									<div className='embedding-card__title'>
										{embeddingPreview.values.length}-dimensional vector
									</div>
								</div>
								<div className='embedding-card__meta'>
									{embeddingPreview.text.length} chars
								</div>
							</div>
							<p className='embedding-card__source'>{embeddingPreview.text}</p>
							<div className='embedding-card__values'>
								{embeddingPreview.values
									.slice(0, EMBEDDING_PREVIEW_SIZE)
									.map((value, index) => (
										<div key={index} className='embedding-value'>
											<span>#{index}</span>
											<strong>{value.toFixed(4)}</strong>
										</div>
									))}
							</div>
						</div>
					)}

					<div className='chat-actions'>
						<button
							type='button'
							onClick={handleSend}
							disabled={isLoading || input.trim() === ""}
							className='chat-button chat-button--primary'
						>
							Send
						</button>
						<button
							type='button'
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
