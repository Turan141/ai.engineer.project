import React, { useState } from "react"
import Chat from "./Chat"
import { DocumentLab } from "./DocumentLab"
import { ImageGen } from "./ImageGen"

type TView = "chat" | "image" | "document"

const App: React.FC = () => {
	const [view, setView] = useState<TView>("chat")

	return (
		<div className={`app-root ${view === "document" ? "app-root--document" : ""}`}>
			<nav className='app-nav'>
				<button
					type='button'
					className={`app-nav__pill ${view === "chat" ? "is-active" : ""}`}
					onClick={() => setView("chat")}
				>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
					Chat
				</button>
				<button
					type='button'
					className={`app-nav__pill ${view === "image" ? "is-active" : ""}`}
					onClick={() => setView("image")}
				>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
						<circle cx='8.5' cy='8.5' r='1.5' />
						<polyline points='21 15 16 10 5 21' />
					</svg>
					Image
				</button>
				<button
					type='button'
					className={`app-nav__pill ${view === "document" ? "is-active" : ""}`}
					onClick={() => setView("document")}
				>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
						<polyline points='14 2 14 8 20 8' />
						<line x1='8' y1='13' x2='16' y2='13' />
						<line x1='8' y1='17' x2='13' y2='17' />
					</svg>
					Docs
				</button>
			</nav>

			<div className={`app-view app-view--${view}`}>
				{view === "chat" ? <Chat /> : view === "image" ? <ImageGen /> : <DocumentLab />}
			</div>
		</div>
	)
}

export default App
