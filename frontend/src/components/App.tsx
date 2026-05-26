import React, { useState } from "react"
import Chat from "./Chat"
import { ImageGen } from "./ImageGen"

type TView = "chat" | "image"

const App: React.FC = () => {
	const [view, setView] = useState<TView>("chat")

	return (
		<div className='app-root'>
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
			</nav>

			<div className='app-view'>{view === "chat" ? <Chat /> : <ImageGen />}</div>
		</div>
	)
}

export default App
