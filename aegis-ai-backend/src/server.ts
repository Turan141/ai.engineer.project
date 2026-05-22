import express from "express"

const app = express()

app.get("/health", (_, res) => {
	res.status(200).json({ status: "ok" })
})

app.listen(3000, () => {
	console.log("Server is running on port 3000")
})
