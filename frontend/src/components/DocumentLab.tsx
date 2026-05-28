import React, { useEffect, useMemo, useRef, useState } from "react"
import { extractDocumentText } from "../services/document.service"
import type { IDocumentOcrEntry } from "../types/document.types"

const ACCEPTED_FILE_TYPES = "image/png,image/jpeg,image/webp,image/bmp,image/tiff"

function formatFileSize(size: number): string {
	if (size < 1024) {
		return `${size} B`
	}

	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} KB`
	}

	return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export const DocumentLab: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [entries, setEntries] = useState<IDocumentOcrEntry[]>([])
	const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isCopied, setIsCopied] = useState(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const controllerRef = useRef<AbortController | null>(null)
	const copyTimeoutRef = useRef<number | null>(null)
	const previewUrl = useMemo(() => {
		if (!selectedFile) {
			return null
		}

		return URL.createObjectURL(selectedFile)
	}, [selectedFile])

	const activeEntry = entries.find((entry) => entry.id === activeEntryId) ?? entries[0] ?? null

	useEffect(() => {
		return () => {
			controllerRef.current?.abort()
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}
			if (copyTimeoutRef.current !== null) {
				window.clearTimeout(copyTimeoutRef.current)
			}
		}
	}, [previewUrl])

	const handlePickFile = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null
		setSelectedFile(file)
		setError(null)
		event.target.value = ""
	}

	const handleProcess = async () => {
		if (!selectedFile || isLoading) {
			return
		}

		setIsLoading(true)
		setError(null)

		const controller = new AbortController()
		controllerRef.current = controller

		try {
			const result = await extractDocumentText(selectedFile, controller.signal)
			const nextEntry: IDocumentOcrEntry = {
				id: crypto.randomUUID(),
				fileName: selectedFile.name,
				fileSize: selectedFile.size,
				mimeType: selectedFile.type,
				text: result.text,
				createdAt: new Date()
			}

			setEntries((prev) => [nextEntry, ...prev])
			setActiveEntryId(nextEntry.id)
		} catch (err: any) {
			if (err?.name !== "AbortError") {
				setError(err?.message ?? "Failed to process document")
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

	const handleClear = () => {
		setSelectedFile(null)
		setError(null)
	}

	const handleCopy = async () => {
		if (!activeEntry?.text) {
			return
		}

		await navigator.clipboard.writeText(activeEntry.text)
		setIsCopied(true)
		if (copyTimeoutRef.current !== null) {
			window.clearTimeout(copyTimeoutRef.current)
		}
		copyTimeoutRef.current = window.setTimeout(() => {
			setIsCopied(false)
			copyTimeoutRef.current = null
		}, 1600)
	}

	return (
		<div className='chat-shell'>
			<section className='chat-panel doc-panel'>
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Document OCR</h1>
						<p>Загружай сканы или фото документов и получай извлеченный текст через backend document service.</p>
					</div>
					<div className={`chat-status ${isLoading ? "is-live" : ""}`}>
						<span className='chat-status__dot' />
						{isLoading ? "Processing" : "Ready"}
					</div>
				</header>

				<div className='doc-workspace'>
					<div className='chat-composer doc-uploader'>
						<div className='chat-composer__topline'>
							<div>
								<div className='chat-composer__title'>Source image</div>
								<div className='chat-composer__hint'>PNG, JPG, WebP, BMP, TIFF</div>
							</div>
							<span className='chat-composer__count'>OCR</span>
						</div>

						<input
							ref={fileInputRef}
							type='file'
							accept={ACCEPTED_FILE_TYPES}
							className='doc-hidden-input'
							onChange={handleFileChange}
						/>

						<button type='button' className='doc-dropzone' onClick={handlePickFile}>
							<span className='doc-dropzone__eyebrow'>Upload</span>
							<strong>{selectedFile ? selectedFile.name : "Выбрать файл для OCR"}</strong>
							<span>
								{selectedFile
									? `${selectedFile.type || "unknown type"} • ${formatFileSize(selectedFile.size)}`
									: "Нажми, чтобы выбрать изображение документа с диска."}
							</span>
						</button>

						{selectedFile && previewUrl && (
							<div className='doc-preview'>
								<img src={previewUrl} alt={selectedFile.name} className='doc-preview__image' />
								<div className='doc-preview__meta'>
									<span>{selectedFile.name}</span>
									<span>{formatFileSize(selectedFile.size)}</span>
								</div>
							</div>
						)}

						{error && <div className='img-error'>{error}</div>}

						<div className='chat-actions'>
							{selectedFile && !isLoading && (
								<button type='button' className='chat-button chat-button--ghost' onClick={handleClear}>
									Clear
								</button>
							)}
							{isLoading ? (
								<button type='button' className='chat-button chat-button--ghost' onClick={handleStop}>
									Stop
								</button>
							) : (
								<button
									type='button'
									className='chat-button chat-button--primary'
									disabled={!selectedFile}
									onClick={handleProcess}
								>
									Run OCR
								</button>
							)}
						</div>
					</div>

					<div className='doc-result'>
						<div className='doc-result__header'>
							<div>
								<div className='chat-composer__title'>Extracted text</div>
								<div className='chat-composer__hint'>Результат активного распознавания</div>
							</div>
							<div className='doc-result__actions'>
								{activeEntry && (
									<button
										type='button'
										className='chat-button chat-button--ghost chat-button--compact'
										onClick={() => void handleCopy()}
									>
										{isCopied ? "Copied" : "Copy text"}
									</button>
								)}
							</div>
						</div>

						<div className='doc-result__body'>
							{activeEntry ? (
								<>
									<div className='doc-result__meta'>
										<span>{activeEntry.fileName}</span>
										<span>{activeEntry.createdAt.toLocaleTimeString()}</span>
										<span>{activeEntry.text.length} chars</span>
									</div>
									<pre className='doc-result__text'>{activeEntry.text}</pre>
								</>
							) : (
								<div className='chat-empty doc-empty-state'>
									<div className='chat-empty__badge'>Output</div>
									<h2>Пока пусто</h2>
									<p>Выбери файл и запусти OCR, чтобы увидеть извлеченный текст в этой панели.</p>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='doc-history'>
					<div className='doc-history__header'>
						<div className='chat-composer__title'>Recent scans</div>
						<span className='chat-composer__count'>{entries.length} items</span>
					</div>
					{entries.length === 0 ? (
						<div className='chat-empty doc-history__empty'>
							<div className='chat-empty__badge'>History</div>
							<h2>Нет обработанных файлов</h2>
							<p>После первого OCR здесь появятся последние результаты для быстрого переключения.</p>
						</div>
					) : (
						<div className='doc-history__grid'>
							{entries.map((entry) => (
								<button
									key={entry.id}
									type='button'
									className={`doc-history__card ${entry.id === activeEntry?.id ? "is-active" : ""}`}
									onClick={() => setActiveEntryId(entry.id)}
								>
									<div className='doc-history__meta'>
										<span>{entry.fileName}</span>
										<span>{entry.createdAt.toLocaleTimeString()}</span>
									</div>
									<p>{entry.text.slice(0, 180) || "No text extracted"}</p>
								</button>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	)
}