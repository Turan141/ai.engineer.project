import React, { useCallback, useRef, useState } from "react"
import { deleteAllKnowledge, uploadToKnowledgeBase } from "../services/knowledge.service"

type TUploadStatus = "idle" | "uploading" | "done" | "error"

interface IUploadEntry {
	id: string
	file: File
	status: TUploadStatus
	error?: string
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPTED = [".md", ".txt"]

export const KnowledgeBase: React.FC = () => {
	const [entries, setEntries] = useState<IUploadEntry[]>([])
	const [isDragOver, setIsDragOver] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const updateEntry = (id: string, patch: Partial<IUploadEntry>) => {
		setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
	}

	const processFile = useCallback(async (file: File) => {
		const id = crypto.randomUUID()
		const entry: IUploadEntry = { id, file, status: "idle" }

		setEntries((prev) => [entry, ...prev])

		// small delay so idle renders before uploading
		await new Promise((r) => setTimeout(r, 60))
		updateEntry(id, { status: "uploading" })

		try {
			await uploadToKnowledgeBase(file)
			updateEntry(id, { status: "done" })
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Upload failed"
			updateEntry(id, { status: "error", error: msg })
		}
	}, [])

	const processFiles = useCallback(
		(files: FileList | File[]) => {
			for (const file of Array.from(files)) {
				void processFile(file)
			}
		},
		[processFile]
	)

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
		if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}

	const handleDragLeave = () => setIsDragOver(false)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.length) {
			processFiles(e.target.files)
			e.target.value = ""
		}
	}

	const removeEntry = (id: string) => {
		setEntries((prev) => prev.filter((e) => e.id !== id))
	}

	const handleDeleteAll = async () => {
		if (!confirm("Удалить всю базу знаний? Это действие нельзя отменить.")) return
		setIsDeleting(true)
		try {
			await deleteAllKnowledge()
			setEntries([])
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Delete failed"
			alert(msg)
		} finally {
			setIsDeleting(false)
		}
	}

	const doneCount = entries.filter((e) => e.status === "done").length
	const errorCount = entries.filter((e) => e.status === "error").length
	const uploadingCount = entries.filter((e) => e.status === "uploading").length

	return (
		<div className='chat-shell'>
			<section className='chat-panel kb-panel'>
				{/* Header */}
				<header className='chat-header'>
					<div>
						<div className='chat-eyebrow'>RAG Knowledge Base</div>
						<h1>Knowledge</h1>
						<p>
							Загружай документы в векторное хранилище. Они будут доступны ИИ при ответах
							в чате.
						</p>
					</div>

					<div className='kb-stats'>
						<div className='kb-stat'>
							<span className='kb-stat__value'>{doneCount}</span>
							<span className='kb-stat__label'>ingested</span>
						</div>
						<div className='kb-stat kb-stat--error' hidden={errorCount === 0}>
							<span className='kb-stat__value'>{errorCount}</span>
							<span className='kb-stat__label'>errors</span>
						</div>
						{uploadingCount > 0 && (
							<div className='kb-stat kb-stat--live'>
								<span className='kb-stat__dot' />
								<span className='kb-stat__label'>uploading</span>
							</div>
						)}
					</div>

					<button
						type='button'
						className='kb-delete-all'
						onClick={() => void handleDeleteAll()}
						disabled={isDeleting}
						aria-label='Delete all knowledge'
					>
						{isDeleting ? "Удаление..." : "Очистить базу"}
					</button>
				</header>

				{/* Drop zone */}
				<div
					className={`kb-dropzone ${isDragOver ? "is-over" : ""}`}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onClick={() => fileInputRef.current?.click()}
					role='button'
					tabIndex={0}
					onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
					aria-label='Upload files to knowledge base'
				>
					<input
						ref={fileInputRef}
						type='file'
						className='doc-hidden-input'
						accept={ACCEPTED.join(",")}
						multiple
						onChange={handleFileChange}
					/>

					<div className='kb-dropzone__icon' aria-hidden='true'>
						<svg
							width='32'
							height='32'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='1.6'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
							<polyline points='17 8 12 3 7 8' />
							<line x1='12' y1='3' x2='12' y2='15' />
						</svg>
					</div>

					<div className='kb-dropzone__copy'>
						<strong>Перетащи файлы или кликни для выбора</strong>
						<span>
							Поддерживаются: {ACCEPTED.join(", ")} · несколько файлов одновременно
						</span>
					</div>
				</div>

				{/* Upload queue */}
				<div className='kb-queue'>
					{entries.length === 0 ? (
						<div className='kb-queue__empty'>
							<p>Загруженные файлы появятся здесь</p>
						</div>
					) : (
						<ul className='kb-queue__list'>
							{entries.map((entry) => (
								<li key={entry.id} className={`kb-item kb-item--${entry.status}`}>
									<div className='kb-item__icon' aria-hidden='true'>
										{entry.status === "uploading" && (
											<span className='kb-item__spinner' />
										)}
										{entry.status === "done" && (
											<svg
												width='16'
												height='16'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2.4'
												strokeLinecap='round'
												strokeLinejoin='round'
											>
												<polyline points='20 6 9 17 4 12' />
											</svg>
										)}
										{entry.status === "error" && (
											<svg
												width='16'
												height='16'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2.4'
												strokeLinecap='round'
												strokeLinejoin='round'
											>
												<line x1='18' y1='6' x2='6' y2='18' />
												<line x1='6' y1='6' x2='18' y2='18' />
											</svg>
										)}
										{entry.status === "idle" && (
											<svg
												width='16'
												height='16'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
												strokeLinejoin='round'
											>
												<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
												<polyline points='14 2 14 8 20 8' />
											</svg>
										)}
									</div>

									<div className='kb-item__info'>
										<span className='kb-item__name'>{entry.file.name}</span>
										<span className='kb-item__meta'>
											{formatBytes(entry.file.size)}
											{entry.error && (
												<span className='kb-item__error'> · {entry.error}</span>
											)}
										</span>
									</div>

									<button
										type='button'
										className='kb-item__remove'
										onClick={() => removeEntry(entry.id)}
										aria-label={`Remove ${entry.file.name}`}
									>
										✕
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	)
}
