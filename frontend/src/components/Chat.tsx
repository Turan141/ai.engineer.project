import React, { useEffect, useRef, useState } from "react"
import { IChatMessage, ICodePatch } from "../types/chat.types"
import {
	clearChatHistory,
	generateEmbedding,
	getChatHistory,
	getDebugMessages,
	streamChat
} from "../services/chat.service"

type TChatExperience = "agent" | "chat"

interface IChatProps {
	experience?: TChatExperience
}

interface IEmbeddingPreview {
	text: string
	values: number[]
}

type TPatchPayload = Pick<ICodePatch, "summary" | "modifiedCode"> &
	Partial<Pick<ICodePatch, "filePath">>

const EMBEDDING_PREVIEW_SIZE = 8
const SESSION_ID_STORAGE_KEY_BY_EXPERIENCE: Record<TChatExperience, string> = {
	agent: "ai-engineer-pet-agent-session-id",
	chat: "ai-engineer-pet-chat-session-id"
}

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

function getFileName(path: string): string {
	return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path
}

function isPatchPayload(value: unknown): value is TPatchPayload {
	return (
		!!value &&
		typeof value === "object" &&
		"summary" in value &&
		"modifiedCode" in value &&
		typeof value.summary === "string" &&
		typeof value.modifiedCode === "string"
	)
}

function isFailedPatchPayload(value: TPatchPayload): boolean {
	return value.summary === "Failed to parse model response" && value.modifiedCode === ""
}

function tryParseJSON(content: string): unknown | null {
	try {
		return JSON.parse(content)
	} catch (_error) {
		return null
	}
}

function extractJSONObject(content: string): string | null {
	const start = content.indexOf("{")
	if (start === -1) {
		return null
	}

	let depth = 0
	let inString = false
	let escaped = false

	for (let i = start; i < content.length; i += 1) {
		const char = content[i]

		if (escaped) {
			escaped = false
			continue
		}

		if (char === "\\") {
			escaped = true
			continue
		}

		if (char === '"') {
			inString = !inString
			continue
		}

		if (inString) {
			continue
		}

		if (char === "{") {
			depth += 1
		}

		if (char === "}") {
			depth -= 1
			if (depth === 0) {
				return content.slice(start, i + 1)
			}
		}
	}

	return null
}

function parsePatchPayload(content: string): TPatchPayload | null {
	const jsonContent = extractJSONObject(content.trim()) ?? content.trim()
	const parsed = tryParseJSON(jsonContent)

	if (isPatchPayload(parsed)) {
		return parsed
	}

	if (
		parsed &&
		typeof parsed === "object" &&
		"text" in parsed &&
		typeof parsed.text === "string"
	) {
		return parsePatchPayload(parsed.text)
	}

	return null
}

function parsePatchFromContent(content: string): ICodePatch | null {
	const parsed = parsePatchPayload(content)

	if (!parsed || isFailedPatchPayload(parsed)) {
		return null
	}

	return {
		filePath: parsed.filePath ?? "Pending file",
		summary: parsed.summary,
		modifiedCode: normalizePatchCode(parsed.modifiedCode)
	}
}

function buildMetadataPatch(message: IChatMessage): ICodePatch | null {
	const patch = message.metadata?.patch

	if (isPatchPayload(patch) && !isFailedPatchPayload(patch)) {
		return {
			filePath: patch.filePath ?? "Pending file",
			summary: patch.summary,
			modifiedCode: normalizePatchCode(patch.modifiedCode)
		}
	}

	return null
}

function normalizePatchCode(content: string): string {
	if (!content.includes("\\n") && !content.includes("\\t")) {
		return content
	}

	return content
		.replace(/\\r\\n/g, "\n")
		.replace(/\\n/g, "\n")
		.replace(/\\t/g, "\t")
		.replace(/\\"/g, '"')
}

function getPatchPreview(content: string): string {
	const lines = content.split("\n")
	const preview = lines.slice(0, 16).join("\n")

	return lines.length > 16 ? `${preview}\n...` : preview
}

function renderInlineCode(text: string): React.ReactNode[] {
	const parts = text.split(/(`[^`]+`)/g)

	return parts.map((part, index) => {
		if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
			return <code key={index}>{part.slice(1, -1)}</code>
		}

		return part
	})
}

function renderMessageBlocks(content: string): React.ReactNode {
	const blocks = content.split(/```/g)

	return blocks.map((block, index) => {
		if (index % 2 === 1) {
			const lines = block.replace(/^\w+\n/, "").trim()

			return (
				<pre key={index} className='agent-code-block'>
					<code>{lines}</code>
				</pre>
			)
		}

		return block
			.split(/\n{2,}/)
			.filter((paragraph) => paragraph.trim() !== "")
			.map((paragraph, paragraphIndex) => {
				const trimmed = paragraph.trim()
				const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)

				if (heading) {
					const HeadingTag = heading[1].length === 1 ? "h3" : "h4"
					return (
						<HeadingTag key={`${index}-${paragraphIndex}`} className='agent-heading'>
							{renderInlineCode(heading[2])}
						</HeadingTag>
					)
				}

				const lines = trimmed.split("\n")
				const isList = lines.every((line) => /^\s*(-|\d+\.)\s+/.test(line))

				if (isList) {
					return (
						<ul key={`${index}-${paragraphIndex}`} className='agent-list'>
							{lines.map((line, lineIndex) => (
								<li key={lineIndex}>
									{renderInlineCode(line.replace(/^\s*(-|\d+\.)\s+/, ""))}
								</li>
							))}
						</ul>
					)
				}

				return (
					<p key={`${index}-${paragraphIndex}`} className='agent-paragraph'>
						{renderInlineCode(trimmed)}
					</p>
				)
			})
	})
}

function AgentMessageContent({
	message,
	onApplyPatch,
	isApplyingPatch
}: {
	message: IChatMessage
	onApplyPatch?: () => void
	isApplyingPatch?: boolean
}) {
	const metadataPatch = buildMetadataPatch(message)
	const patch = metadataPatch ?? parsePatchFromContent(message.content)
	const file =
		typeof message.metadata?.file === "string"
			? message.metadata.file
			: patch?.filePath ?? null
	const isToolResult = message.metadata?.type === "tool_result"

	return (
		<div className='agent-answer'>
			{file && (
				<div className='agent-source'>
					<span className='agent-source__label'>
						{patch ? "Patch target" : "Implementation analyzed from"}
					</span>
					<span className='agent-source__file' title={file}>
						{getFileName(file)}
					</span>
				</div>
			)}
			{patch && (
				<div className='agent-patch'>
					<div className='agent-patch__header'>
						<div className='agent-patch__meta'>
							<span className='agent-patch__eyebrow'>Pending patch</span>
							<strong>{patch.summary}</strong>
						</div>
						{onApplyPatch && (
							<button
								type='button'
								className='agent-patch__apply'
								onClick={onApplyPatch}
								disabled={isApplyingPatch}
							>
								{isApplyingPatch ? "Applying..." : "Apply patch"}
							</button>
						)}
					</div>
					<div className='agent-patch__file' title={patch.filePath}>
						{patch.filePath}
					</div>
					<pre className='agent-code-block agent-code-block--patch'>
						<code>{getPatchPreview(patch.modifiedCode)}</code>
					</pre>
				</div>
			)}
			{isToolResult ? (
				<pre className='agent-code-block agent-code-block--tool'>
					<code>{message.content}</code>
				</pre>
			) : patch ? null : (
				<div className='agent-answer__content'>{renderMessageBlocks(message.content)}</div>
			)}
		</div>
	)
}

export const Chat: React.FC<IChatProps> = ({ experience = "chat" }) => {
	const [messages, setMessages] = useState<IChatMessage[]>([])
	const [input, setInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isApplyingPatch, setIsApplyingPatch] = useState(false)
	const [isHistoryLoading, setIsHistoryLoading] = useState(false)
	const [isEmbeddingLoading, setIsEmbeddingLoading] = useState(false)
	const [isClearing, setIsClearing] = useState(false)
	const [embeddingPreview, setEmbeddingPreview] = useState<IEmbeddingPreview | null>(null)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const sessionStorageKey = SESSION_ID_STORAGE_KEY_BY_EXPERIENCE[experience]
	const [sessionId] = useState(() => {
		const storedSessionId = window.localStorage.getItem(sessionStorageKey)?.trim()

		if (storedSessionId) {
			return storedSessionId
		}

		const nextSessionId = crypto.randomUUID()
		window.localStorage.setItem(sessionStorageKey, nextSessionId)
		return nextSessionId
	})
	const [debugMessages, setDebugMessages] = useState<IChatMessage[] | null>(null)
	const [isDebugLoading, setIsDebugLoading] = useState(false)
	const [debugError, setDebugError] = useState<string | null>(null)
	const controllerRef = useRef<AbortController | null>(null)
	const embeddingControllerRef = useRef<AbortController | null>(null)
	const messagesRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const controller = new AbortController()
		setIsHistoryLoading(true)

		void getChatHistory(sessionId, controller.signal)
			.then((loadedMessages) => {
				setMessages((prev) => (prev.length === 0 ? loadedMessages : prev))
			})
			.catch((err: any) => {
				if (err?.name !== "AbortError") {
					console.error(err)
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setIsHistoryLoading(false)
				}
			})

		return () => {
			controller.abort()
		}
	}, [sessionId])

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

	const handleClearChat = async () => {
		if (!confirm("Очистить историю чата?")) return
		setIsClearing(true)
		try {
			await clearChatHistory(sessionId)
			setMessages([])
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Clear failed"
			alert(msg)
		} finally {
			setIsClearing(false)
		}
	}

	const sendAgentMessage = async (
		trimmed: string,
		options: { clearInput?: boolean; applyingPatch?: boolean } = {}
	) => {
		if (!trimmed || isLoading || isHistoryLoading || isApplyingPatch) {
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

		if (options.clearInput) {
			setInput("")
		}
		setIsLoading(true)
		if (options.applyingPatch) {
			setIsApplyingPatch(true)
		}

		const controller = new AbortController()
		controllerRef.current = controller

		try {
			await streamChat({
				sessionId,
				message: trimmed,
				mode: experience,
				signal: controller.signal,
				onChunk: (chunk) => {
					setMessages((prev) =>
						updateLastAssistantMessage(prev, (message) => ({
							...message,
							content: message.content + chunk.text,
							metadata: {
								...message.metadata,
								...chunk.metadata,
								...(chunk.type ? { type: chunk.type } : {})
							}
						}))
					)
				}
			})
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
			setIsApplyingPatch(false)
			controllerRef.current = null
		}
	}

	const handleSend = async () => {
		const trimmed = input.trim()
		await sendAgentMessage(trimmed, { clearInput: true })
	}

	const handleApplyPatch = async () => {
		await sendAgentMessage("confirm", { applyingPatch: true })
	}

	const handleGenerateEmbedding = async () => {
		const trimmed = input.trim()

		if (!trimmed || isEmbeddingLoading || isHistoryLoading) {
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
		? isApplyingPatch
			? "Applying patch"
			: "Generating"
		: isHistoryLoading
			? "Loading history"
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
							<div className='settings-section__label'>Mode</div>
							<div className='chat-mode-switch' aria-label='Current mode'>
								<span className='chat-pill is-active'>
									{experience === "agent" ? "Agent /chat/stream" : "Chat /chat/stream"}
								</span>
							</div>
							<p className='settings-section__hint'>
								{experience === "agent"
									? "Tool routing is isolated in the Agent tab."
									: "Plain chat is isolated from agent tool routing."}
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
								disabled={input.trim() === "" || isEmbeddingLoading || isHistoryLoading}
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
						<h1>{experience === "agent" ? "Agent workbench" : "Chat workbench"}</h1>
						<p>
							{experience === "agent"
								? "Agent mode uses /chat/stream and can route tool actions from the prompt."
								: "Regular chat mode uses /chat/stream without agent tool routing."}
						</p>
					</div>
					<div
						className={`chat-status ${isLoading || isEmbeddingLoading ? "is-live" : ""}`}
					>
						<span className='chat-status__dot' />
						{statusLabel}
					</div>
					<button
						type='button'
						className='kb-delete-all'
						onClick={() => void handleClearChat()}
						disabled={isClearing || isLoading}
						aria-label='Clear chat history'
					>
						{isClearing ? "Очистка..." : "Очистить чат"}
					</button>
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
									m.role === "assistant" ? (
										<AgentMessageContent
											message={m}
											onApplyPatch={experience === "agent" ? handleApplyPatch : undefined}
											isApplyingPatch={isApplyingPatch}
										/>
									) : (
										m.content
									)
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
								{experience === "agent" ? "Agent mode" : "Chat mode"}
							</div>
						</div>
						<div className='chat-composer__topline-end'>
							<span className='chat-composer__count'>{input.trim().length} chars</span>
							<button
								type='button'
								className='chat-settings-btn'
								onClick={() => setIsSettingsOpen(true)}
								disabled={isHistoryLoading}
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
						disabled={isLoading || isHistoryLoading}
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
							disabled={isLoading || isHistoryLoading || input.trim() === ""}
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
