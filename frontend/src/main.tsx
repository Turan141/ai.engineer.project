import React from "react"
import { createRoot } from "react-dom/client"
import Chat from "./components/Chat"
import "./styles.css"

const el = document.getElementById("root")
if (!el) throw new Error("Root element not found")

createRoot(el).render(
	<React.StrictMode>
		<Chat />
	</React.StrictMode>
)
