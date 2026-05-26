import React, { useRef, useState } from "react"
import { generateImage } from "../services/image.service"
import type { IGeneratedImage } from "../types/image.types"

export const ImageGen: React.FC = () => {
	const [prompt, setPrompt] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [images, setImages] = useState<IGeneratedImage[]>([])
	const [error, setError] = useState<string | null>(null)
	const controllerRef = useRef<AbortController | null>(null)

	const handleGenerate = async () => {
		const trimmed = prompt.trim()
		if (!trimmed || isLoading) return

		setIsLoading(true)
		setError(null)

		const controller = new AbortController()
		controllerRef.current = controller

		try {
			const result = await generateImage({ prompt: trimmed }, controller.signal)
			setImages((prev) => [
				{ ...result, prompt: trimmed, createdAt: new Date() },
				...prev
			])
		} catch (err: any) {
			if (err?.name !== "AbortError") {
				setError(err?.message ?? "Failed to generate image.")
			}
		} finally {
			setIsLoading(false)
			controllerRef.current = null
		}
	}

	const handleStop = () => {
		controllerRef.current?.abort()
		controllerRef.current = null
		setIsLoading(false)
	}

	const handleRemove = (id: string) => {
		setImages((prev) => prev.filter((img) => img.id !== id))
	}

	return (
		<div className='chat-shell'>
			<section className='chat-panel'>
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Image Studio</h1>
						<p>Генерируй изображения через ComfyUI из текстового описания.</p>
					</div>
					<div className={`chat-status ${isLoading ? "is-live" : ""}`}>
						<span className='chat-status__dot' />
						{isLoading ? "Generating" : "Ready"}
					</div>
				</header>

				{/* Composer */}
				<div className='chat-composer img-composer'>
					<div className='chat-composer__topline'>
						<div>
							<div className='chat-composer__title'>Prompt</div>
							<div className='chat-composer__hint'>Опиши что хочешь увидеть</div>
						</div>
						<span className='chat-composer__count'>{prompt.trim().length} chars</span>
					</div>

					<textarea
						className='chat-input'
						rows={4}
						placeholder='A cyberpunk city at night, neon lights, rain, ultra detailed...'
						value={prompt}
						disabled={isLoading}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && e.ctrlKey) {
								e.preventDefault()
								handleGenerate()
							}
						}}
					/>

					{error && <div className='img-error'>{error}</div>}

					<div className='chat-actions'>
						{isLoading ? (
							<button
								type='button'
								className='chat-button chat-button--ghost'
								onClick={handleStop}
							>
								Stop
							</button>
						) : (
							<button
								type='button'
								className='chat-button chat-button--primary'
								disabled={!prompt.trim()}
								onClick={handleGenerate}
							>
								Generate
							</button>
						)}
					</div>
				</div>

				{/* Gallery */}
				<div className='img-gallery-wrap'>
					{images.length === 0 && !isLoading && (
						<div className='chat-empty'>
							<div className='chat-empty__badge'>Gallery</div>
							<h2>Ничего нет</h2>
							<p>Сгенерированные изображения появятся здесь.</p>
						</div>
					)}

					<div className='img-gallery'>
						{isLoading && (
							<div className='img-card img-card--skeleton'>
								<div className='img-card__skeleton-img'>
									<span className='chat-typing' aria-label='Generating'>
										<span />
										<span />
										<span />
									</span>
								</div>
								<div className='img-card__meta'>
									<div className='img-card__skeleton-line' />
									<div className='img-card__skeleton-line img-card__skeleton-line--short' />
								</div>
							</div>
						)}

						{images.map((img) => (
							<div key={img.id} className='img-card'>
								<div className='img-card__frame'>
									<img
										src={img.url}
										alt={img.prompt}
										className='img-card__image'
										onError={(e) => {
											;(e.currentTarget as HTMLImageElement).style.display = "none"
											const fallback =
												e.currentTarget.nextElementSibling as HTMLElement | null
											if (fallback) fallback.style.display = "flex"
										}}
									/>
									<div className='img-card__fallback' style={{ display: "none" }}>
										No preview
									</div>
									<button
										type='button'
										className='img-card__remove'
										aria-label='Remove'
										onClick={() => handleRemove(img.id)}
									>
										✕
									</button>
								</div>
								<div className='img-card__meta'>
									<p className='img-card__prompt'>{img.prompt}</p>
									<span className='img-card__time'>
										{img.createdAt.toLocaleTimeString()}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	)
}
