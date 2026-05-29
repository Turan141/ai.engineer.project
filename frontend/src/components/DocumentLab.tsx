import React, { useEffect, useMemo, useRef, useState } from "react"
import { processDocument } from "../services/document.service"
import type {
	IDocumentAnalysisResult,
	IDocumentProcessEntry
} from "../types/document.types"

const ACCEPTED_FILE_TYPES = "image/png,image/jpeg,image/webp,image/bmp,image/tiff"
type TResultTab = "ocr" | "analysis"

function formatFileSize(size: number): string {
	if (size < 1024) return `${size} B`
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
	return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatAnalysisForClipboard(analysis: IDocumentAnalysisResult): string {
	return JSON.stringify(analysis, null, 2)
}

export const DocumentLab: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [entries, setEntries] = useState<IDocumentProcessEntry[]>([])
	const [modalEntry, setModalEntry] = useState<IDocumentProcessEntry | null>(null)
	const [modalTab, setModalTab] = useState<TResultTab>("analysis")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [copiedField, setCopiedField] = useState<"rawText" | "analysis" | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const controllerRef = useRef<AbortController | null>(null)
	const copyTimeoutRef = useRef<number | null>(null)

	const previewUrl = useMemo(() => {
		if (!selectedFile) return null
		return URL.createObjectURL(selectedFile)
	}, [selectedFile])

	useEffect(() => {
		return () => {
			controllerRef.current?.abort()
			if (previewUrl) URL.revokeObjectURL(previewUrl)
			if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current)
		}
	}, [previewUrl])

	useEffect(() => {
		if (!modalEntry) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setModalEntry(null)
		}
		document.addEventListener("keydown", onKey)
		return () => document.removeEventListener("keydown", onKey)
	}, [modalEntry])

	const handlePickFile = () => fileInputRef.current?.click()

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null
		setSelectedFile(file)
		setError(null)
		e.target.value = ""
	}

	const handleProcess = async () => {
		if (!selectedFile || isLoading) return
		setIsLoading(true)
		setError(null)
		const controller = new AbortController()
		controllerRef.current = controller
		try {
			const result = await processDocument(selectedFile, controller.signal)
			const nextEntry: IDocumentProcessEntry = {
				id: crypto.randomUUID(),
				fileName: selectedFile.name,
				fileSize: selectedFile.size,
				mimeType: selectedFile.type,
				rawText: result.rawText,
				analysis: result.analysis,
				createdAt: new Date()
			}
			setEntries((prev) => [nextEntry, ...prev])
			setModalTab("analysis")
			setModalEntry(nextEntry)
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

	const handleCopy = async (field: "rawText" | "analysis") => {
		if (!modalEntry) return
		const value =
			field === "rawText"
				? modalEntry.rawText
				: formatAnalysisForClipboard(modalEntry.analysis)
		if (!value) return
		try {
			await navigator.clipboard.writeText(value)
			setCopiedField(field)
		} catch {
			setError("Failed to copy content to clipboard")
			return
		}
		if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current)
		copyTimeoutRef.current = window.setTimeout(() => {
			setCopiedField(null)
			copyTimeoutRef.current = null
		}, 1600)
	}

	const handleSelectEntry = (entry: IDocumentProcessEntry) => {
		setModalTab("analysis")
		setModalEntry(entry)
	}

	return (
		<div className='chat-shell chat-shell--document'>
			<section className='chat-panel chat-panel--document doc-panel'>
				<header className='chat-header'>
					<div className='doc-header-copy'>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Document Review</h1>
						<p>
							Загружай сканы или фото документов и получай OCR плюс структурированный
							разбор: тип, summary, keywords и entities.
						</p>
						<div className='doc-header-highlights'>
							<span className='doc-header-chip'>OCR</span>
							<span className='doc-header-chip'>Summary</span>
							<span className='doc-header-chip'>Entities</span>
						</div>
					</div>
					<div className={`chat-status ${isLoading ? "is-live" : ""}`}>
						<span className='chat-status__dot' />
						{isLoading ? "Processing" : "Ready"}
					</div>
				</header>

				<div className='doc-workspace doc-workspace--single'>
					<div className='chat-composer doc-uploader'>
						<div className='chat-composer__topline'>
							<div>
								<div className='chat-composer__title'>Source image</div>
								<div className='chat-composer__hint'>PNG, JPG, WebP, BMP, TIFF</div>
							</div>
							<span className='chat-composer__count'>OCR + structured analysis</span>
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
							<strong>
								{selectedFile ? selectedFile.name : "Выбрать документ для обработки"}
							</strong>
							<span>
								{selectedFile
									? `${selectedFile.type || "unknown type"} • ${formatFileSize(selectedFile.size)}`
									: "Нажми, чтобы выбрать изображение документа с диска."}
							</span>
						</button>

						{selectedFile && previewUrl && (
							<div className='doc-preview'>
								<img
									src={previewUrl}
									alt={selectedFile.name}
									className='doc-preview__image'
								/>
								<div className='doc-preview__meta'>
									<span>{selectedFile.name}</span>
									<span>{formatFileSize(selectedFile.size)}</span>
								</div>
							</div>
						)}

						{error && <div className='img-error'>{error}</div>}

						<div className='doc-actions'>
							{selectedFile && !isLoading && (
								<button
									type='button'
									className='chat-button chat-button--ghost doc-action-button'
									onClick={handleClear}
								>
									Clear
								</button>
							)}
							{isLoading ? (
								<button
									type='button'
									className='chat-button chat-button--ghost doc-action-button'
									onClick={handleStop}
								>
									Stop
								</button>
							) : (
								<button
									type='button'
									className='chat-button chat-button--primary doc-action-button doc-action-button--primary'
									disabled={!selectedFile}
									onClick={handleProcess}
								>
									Process document
								</button>
							)}
						</div>
					</div>
				</div>

				<div className='doc-history'>
					<div className='doc-history__header'>
						<div className='chat-composer__title'>Recent documents</div>
						<span className='chat-composer__count'>{entries.length} items</span>
					</div>
					{entries.length === 0 ? (
						<div className='chat-empty doc-history__empty'>
							<div className='chat-empty__badge'>History</div>
							<h2>Нет обработанных файлов</h2>
							<p>
								После первой обработки здесь появятся последние документы для быстрого
								переключения.
							</p>
						</div>
					) : (
						<div className='doc-history__grid'>
							{entries.map((entry) => (
								<button
									key={entry.id}
									type='button'
									className={`doc-history__card ${entry.id === modalEntry?.id ? "is-active" : ""}`}
									onClick={() => handleSelectEntry(entry)}
								>
									<div className='doc-history__meta'>
										<span>{entry.fileName}</span>
										<span>{entry.createdAt.toLocaleTimeString()}</span>
									</div>
									{entry.analysis.documentType && (
										<div className='doc-history__type'>{entry.analysis.documentType}</div>
									)}
									<p>
										{entry.analysis.summary.slice(0, 180) ||
											entry.rawText.slice(0, 180) ||
											"No content extracted"}
									</p>
								</button>
							))}
						</div>
					)}
				</div>
			</section>

			{modalEntry && (
				<div
					className='doc-modal-backdrop'
					onClick={() => setModalEntry(null)}
					role='dialog'
					aria-modal='true'
					aria-label='Document result'
				>
					<div className='doc-modal' onClick={(e) => e.stopPropagation()}>
						<div className='doc-modal__header'>
							<div>
								<div className='doc-modal__filename'>{modalEntry.fileName}</div>
								<div className='doc-modal__meta'>
									{modalEntry.createdAt.toLocaleTimeString()} ·{" "}
									{modalEntry.rawText.length} OCR chars ·{" "}
									{modalEntry.analysis.keywords.length} keywords
								</div>
							</div>
							<div className='doc-modal__header-actions'>
								<button
									type='button'
									className='chat-button chat-button--ghost chat-button--compact'
									onClick={() => void handleCopy("rawText")}
								>
									{copiedField === "rawText" ? "Copied OCR" : "Copy OCR"}
								</button>
								<button
									type='button'
									className='chat-button chat-button--ghost chat-button--compact'
									onClick={() => void handleCopy("analysis")}
								>
									{copiedField === "analysis" ? "Copied" : "Copy analysis"}
								</button>
								<button
									type='button'
									className='doc-modal__close'
									onClick={() => setModalEntry(null)}
									aria-label='Close'
								>
									✕
								</button>
							</div>
						</div>

						<div className='doc-result__toolbar doc-modal__tabs'>
							<div className='doc-tab-switch' role='tablist' aria-label='Result view'>
								<button
									type='button'
									role='tab'
									aria-selected={modalTab === "analysis"}
									className={`doc-tab ${modalTab === "analysis" ? "is-active" : ""}`}
									onClick={() => setModalTab("analysis")}
								>
									Analysis
								</button>
								<button
									type='button'
									role='tab'
									aria-selected={modalTab === "ocr"}
									className={`doc-tab ${modalTab === "ocr" ? "is-active" : ""}`}
									onClick={() => setModalTab("ocr")}
								>
									OCR
								</button>
							</div>
						</div>

						<div className='doc-modal__body'>
							{modalTab === "ocr" ? (
								<pre className='doc-result__text'>{modalEntry.rawText}</pre>
							) : (
								<div className='doc-analysis'>
									<div className='doc-analysis__cards'>
										<div className='doc-analysis__card'>
											<span className='doc-analysis__label'>Document type</span>
											<strong>{modalEntry.analysis.documentType || "Unknown"}</strong>
										</div>
										<div className='doc-analysis__card'>
											<span className='doc-analysis__label'>Summary</span>
											<p>
												{modalEntry.analysis.summary || "Summary is not available yet."}
											</p>
										</div>
									</div>
									<div className='doc-analysis__block'>
										<div className='doc-analysis__label'>Keywords</div>
										{modalEntry.analysis.keywords.length > 0 ? (
											<div className='doc-analysis__keywords'>
												{modalEntry.analysis.keywords.map((keyword) => (
													<span key={keyword} className='doc-analysis__keyword'>
														{keyword}
													</span>
												))}
											</div>
										) : (
											<p className='doc-analysis__empty'>Keywords were not detected.</p>
										)}
									</div>
									<div className='doc-analysis__block'>
										<div className='doc-analysis__label'>Entities</div>
										{Object.keys(modalEntry.analysis.entities).length > 0 ? (
											<div className='doc-analysis__entities'>
												{Object.entries(modalEntry.analysis.entities).map(
													([key, value]) => (
														<div key={key} className='doc-analysis__entity'>
															<span>{key}</span>
															<strong>{value}</strong>
														</div>
													)
												)}
											</div>
										) : (
											<p className='doc-analysis__empty'>
												Named entities were not detected.
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
