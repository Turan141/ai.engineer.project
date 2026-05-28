import React, { useEffect, useRef, useState } from "react"
import { IChatMessage } from "../types/chat.types"
import {
	generateChat,
	generateEmbedding,
	getDebugMessages,
	streamChat
} from "../services/chat.service"

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
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [sessionId] = useState(() => crypto.randomUUID())
	const [debugMessages, setDebugMessages] = useState<IChatMessage[] | null>(null)
	const [isDebugLoading, setIsDebugLoading] = useState(false)
	const [debugError, setDebugError] = useState<string | null>(null)
	const controllerRef = useRef<AbortController | null>(null)
	const embeddingControllerRef = useRef<AbortController | null>(null)
	const messagesRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		return () => {
			controllerRef.current?.abort()
			controllerRef.current = null
			embeddingControllerRef.current?.abort()
			embeddingControllerRef.current = null
		}
	}, [])

	useEffect(() => {
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight
		}
	}, [messages])

	useEffect(() => {
		if (!isSettingsOpen) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsSettingsOpen(false)
		}

		document.addEventListener("keydown", handleEscape)
		return () => document.removeEventListener("keydown", handleEscape)
	}, [isSettingsOpen])

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
					sessionId,
					message: trimmed,
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

	const handleFetchDebugMessages = async () => {
		setIsDebugLoading(true)
		setDebugError(null)

		try {
			const loadedMessages = await getDebugMessages(sessionId)
			setDebugMessages(loadedMessages)
		} catch (err: any) {
			setDebugError(err?.message ?? "Failed to fetch debug messages")
		} finally {
			setIsDebugLoading(false)
		}
	}

	const handleStop = () => {
		if (controllerRef.current) {
			controllerRef.current.abort()
			controllerRef.current = null
			setIsLoading(false)
		}
	}

	const statusLabel = isLoading
		? "Generating"
		: isEmbeddingLoading
			? "Embedding"
			: "Ready"

	return (
		<div className='chat-shell'>
			{isSettingsOpen && (
				<div className='settings-overlay' onClick={() => setIsSettingsOpen(false)}>
					<div
						className='settings-modal'
						onClick={(e) => e.stopPropagation()}
						role='dialog'
						aria-modal='true'
						aria-label='Options'
					>
						<div className='settings-modal__header'>
							<span className='settings-modal__title'>Options</span>
							<button
								type='button'
								className='settings-modal__close'
								onClick={() => setIsSettingsOpen(false)}
								aria-label='Close'
							>
								✕
							</button>
						</div>

						<div className='settings-section'>
							<div className='settings-section__label'>Chat mode</div>
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
							<p className='settings-section__hint'>
								{mode === "stream"
									? "Ответ придёт потоком сразу по мере генерации."
									: "Ответ вернётся одним сообщением через стандартный chat endpoint."}
							</p>
						</div>

						<div className='settings-section'>
							<div className='settings-section__label'>Embeddings</div>
							<button
								type='button'
								onClick={() => {
									handleGenerateEmbedding()
									setIsSettingsOpen(false)
								}}
								disabled={input.trim() === "" || isEmbeddingLoading}
								className='chat-button chat-button--ghost'
							>
								{isEmbeddingLoading ? "Embedding..." : "Generate /embeddings"}
							</button>
							{input.trim() === "" && (
								<p className='settings-section__hint'>
									Введи текст в поле ввода, чтобы сгенерировать embedding.
								</p>
							)}
						</div>

						<div className='settings-section'>
							<div className='settings-section__label'>Debug</div>
							<button
								type='button'
								onClick={handleFetchDebugMessages}
								disabled={isDebugLoading}
								className='chat-button chat-button--ghost'
							>
								{isDebugLoading ? "Loading..." : "Fetch memory /debug/messages"}
							</button>
							<p className='settings-section__hint'>
								Session: <code>{sessionId}</code>
							</p>
							{debugError && (
								<p
									className='settings-section__hint'
									style={{ color: "var(--color-error, #f87171)" }}
								>
									{debugError}
								</p>
							)}
							{debugMessages !== null && (
								<pre className='debug-messages-pre'>
									{JSON.stringify(debugMessages, null, 2)}
								</pre>
							)}
						</div>
					</div>
				</div>
			)}

			<section className='chat-panel'>
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Chat workbench</h1>
						<p>
							Обычный chat, streaming chat и embeddings доступны из одного интерфейса.
						</p>
					</div>
					<div
						className={`chat-status ${isLoading || isEmbeddingLoading ? "is-live" : ""}`}
					>
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
							<div className='chat-message__bubble'>
								{m.role === "assistant" && m.content === "" ? (
									<span className='chat-typing' aria-label='Generating response'>
										<span />
										<span />
										<span />
									</span>
								) : (
									m.content
								)}
							</div>
						</div>
					))}
				</div>

				<div className='chat-composer'>
					<div className='chat-composer__topline'>
						<div>
							<div className='chat-composer__title'>Your prompt</div>
							<div className='chat-composer__hint'>
								{mode === "stream" ? "Stream mode" : "Single mode"}
							</div>
						</div>
						<div className='chat-composer__topline-end'>
							<span className='chat-composer__count'>{input.trim().length} chars</span>
							<button
								type='button'
								className='chat-settings-btn'
								onClick={() => setIsSettingsOpen(true)}
								aria-label='Open options'
							>
								<svg
									width='18'
									height='18'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<circle cx='9' cy='6' r='2' />
									<path d='M4 6h3M11 6h9' />
									<circle cx='15' cy='12' r='2' />
									<path d='M4 12h9M17 12h3' />
									<circle cx='10' cy='18' r='2' />
									<path d='M4 18h4M12 18h8' />
								</svg>
							</button>
						</div>
					</div>

					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
								e.preventDefault()
								handleSend()
							}
						}}
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
