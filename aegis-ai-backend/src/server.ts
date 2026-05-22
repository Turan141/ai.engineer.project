import express from "express"
import { chatRouter } from "./routes/chat.route.js"

const app = express()

app.use(express.json())
app.use("/api", chatRouter)

app.listen(3000, () => {
	console.log("Server is running on port 3000")
})
