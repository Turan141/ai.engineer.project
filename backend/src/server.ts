import "dotenv/config"
import express from "express"
import { chatRouter } from "./routes/chat.route.js"

const app = express()

app.use(express.json())
app.use("/api", chatRouter)

// Health check endpoint
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" })
})

app.listen(3000, () => {
	console.log("Server is running on port 3000")
})
