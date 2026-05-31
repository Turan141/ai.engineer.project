import React from "react"
import { createRoot } from "react-dom/client"
import App from "./components/App"
import { Analytics } from "@vercel/analytics/next"

import "./styles.css"

const el = document.getElementById("root")
if (!el) throw new Error("Root element not found")

createRoot(el).render(
	<React.StrictMode>
		<App />
		<Analytics />
	</React.StrictMode>
)
