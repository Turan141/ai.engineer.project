import React, { useEffect, useMemo, useRef, useState } from "react"
import { processDocument } from "../services/document.service"
import type {
	IDocumentAnalysisResult,
	IDocumentProcessEntry
} from "../types/document.types"

const ACCEPTED_FILE_TYPES = "image/png,image/jpeg,image/webp,image/bmp,image/tiff"
type TResultTab = "ocr" | "analysis"

function formatFileSize(size: number): string {
	if (size < 1024) {
		return `${size} B`
	}

	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} KB`
	}

	return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatAnalysisForClipboard(analysis: IDocumentAnalysisResult): string {
	return JSON.stringify(analysis, null, 2)
}

export const DocumentLab: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [entries, setEntries] = useState<IDocumentProcessEntry[]>([])
	const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
	const [activeResultTab, setActiveResultTab] = useState<TResultTab>("analysis")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [copiedField, setCopiedField] = useState<"rawText" | "analysis" | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const controllerRef = useRef<AbortController | null>(null)
	const copyTimeoutRef = useRef<number | null>(null)
	const previewUrl = useMemo(() => {
		if (!selectedFile) {
			return null
		}

		return URL.createObjectURL(selectedFile)
	}, [selectedFile])

	const activeEntry =
		entries.find((entry) => entry.id === activeEntryId) ?? entries[0] ?? null

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
			setActiveEntryId(nextEntry.id)
			setActiveResultTab("analysis")
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
		if (!activeEntry) {
			return
		}

		const value =
			field === "rawText"
				? activeEntry.rawText
				: formatAnalysisForClipboard(activeEntry.analysis)
		if (!value) {
			return
		}

		try {
			await navigator.clipboard.writeText(value)
			setCopiedField(field)
		} catch {
			setError("Failed to copy content to clipboard")
			return
		}
		if (copyTimeoutRef.current !== null) {
			window.clearTimeout(copyTimeoutRef.current)
		}
		copyTimeoutRef.current = window.setTimeout(() => {
			setCopiedField(null)
			copyTimeoutRef.current = null
		}, 1600)
	}

	return (
		<div className='chat-shell'>
			<section className='chat-panel doc-panel'>
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>AI engineer pet</div>
						<h1>Document Review</h1>
						<p>
							Загружай сканы или фото документов и получай OCR плюс структурированный
							разбор: тип, summary, keywords и entities.
						</p>
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

						<div className='chat-actions'>
							{selectedFile && !isLoading && (
								<button
									type='button'
									className='chat-button chat-button--ghost'
									onClick={handleClear}
								>
									Clear
								</button>
							)}
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
									disabled={!selectedFile}
									onClick={handleProcess}
								>
									Process document
								</button>
							)}
						</div>
					</div>

					<div className='doc-result'>
						<div className='doc-result__header'>
							<div>
								<div className='chat-composer__title'>Processing result</div>
								<div className='chat-composer__hint'>
									OCR-текст и структурированный анализ для активного документа
								</div>
							</div>
							{activeEntry && (
								<div className='doc-result__actions'>
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
										disabled={
											!activeEntry.analysis.summary &&
											activeEntry.analysis.keywords.length === 0 &&
											Object.keys(activeEntry.analysis.entities).length === 0
										}
									>
										{copiedField === "analysis" ? "Copied analysis" : "Copy analysis"}
									</button>
								</div>
							)}
						</div>

						<div className='doc-result__body'>
							{activeEntry ? (
								<div className='doc-sections'>
									<div className='doc-result__meta'>
										<span>{activeEntry.fileName}</span>
										<span>{activeEntry.createdAt.toLocaleTimeString()}</span>
										<span>{activeEntry.rawText.length} OCR chars</span>
										<span>{activeEntry.analysis.keywords.length} keywords</span>
										<span>
											{Object.keys(activeEntry.analysis.entities).length} entities
										</span>
									</div>
									<div className='doc-result__toolbar'>
										<div className='doc-tab-switch' role='tablist' aria-label='Document result view'>
											<button
												type='button'
												role='tab'
												aria-selected={activeResultTab === "analysis"}
												className={`doc-tab ${activeResultTab === "analysis" ? "is-active" : ""}`}
												onClick={() => setActiveResultTab("analysis")}
											>
												Analysis
											</button>
											<button
												type='button'
												role='tab'
												aria-selected={activeResultTab === "ocr"}
												className={`doc-tab ${activeResultTab === "ocr" ? "is-active" : ""}`}
												onClick={() => setActiveResultTab("ocr")}
											>
												OCR
											</button>
										</div>
									</div>
									{activeResultTab === "ocr" ? (
										<section className='doc-section doc-section--single'>
											<div className='doc-section__header'>
												<div className='doc-section__title'>OCR text</div>
												<div className='doc-section__hint'>Исходное распознавание</div>
											</div>
											<pre className='doc-result__text'>{activeEntry.rawText}</pre>
										</section>
									) : (
										<section className='doc-section doc-section--single'>
											<div className='doc-section__header'>
												<div className='doc-section__title'>Structured analysis</div>
												<div className='doc-section__hint'>
													Тип документа, summary, keywords и entities
												</div>
											</div>
											<div className='doc-analysis'>
												<div className='doc-analysis__cards'>
													<div className='doc-analysis__card'>
														<span className='doc-analysis__label'>Document type</span>
														<strong>
															{activeEntry.analysis.documentType || "Unknown"}
														</strong>
													</div>
													<div className='doc-analysis__card'>
														<span className='doc-analysis__label'>Summary</span>
														<p>
															{activeEntry.analysis.summary ||
																"Summary is not available yet."}
														</p>
													</div>
												</div>
												<div className='doc-analysis__block'>
													<div className='doc-analysis__label'>Keywords</div>
													{activeEntry.analysis.keywords.length > 0 ? (
														<div className='doc-analysis__keywords'>
															{activeEntry.analysis.keywords.map((keyword) => (
																<span key={keyword} className='doc-analysis__keyword'>
																	{keyword}
																</span>
															))}
														</div>
													) : (
														<p className='doc-analysis__empty'>
															Keywords were not detected.
														</p>
													)}
												</div>
												<div className='doc-analysis__block'>
													<div className='doc-analysis__label'>Entities</div>
													{Object.keys(activeEntry.analysis.entities).length > 0 ? (
														<div className='doc-analysis__entities'>
															{Object.entries(activeEntry.analysis.entities).map(
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
										</section>
									)}
								</div>
							) : (
								<div className='chat-empty doc-empty-state'>
									<div className='chat-empty__badge'>Output</div>
									<h2>Пока пусто</h2>
									<p>
										Выбери файл и запусти обработку, чтобы увидеть OCR-текст и анализ в
										этой панели.
									</p>
								</div>
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
									className={`doc-history__card ${entry.id === activeEntry?.id ? "is-active" : ""}`}
									onClick={() => setActiveEntryId(entry.id)}
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
		</div>
	)
}
