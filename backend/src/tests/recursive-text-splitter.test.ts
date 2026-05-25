import { readFileSync } from "fs"
import { RecursiveTextSplitter } from "../knowledge/recursitve-text-splitter.js"

async function main(): Promise<void> {
	console.log("=================================")
	console.log("TEST 1: Paragraph splitting")
	console.log("=================================")

	const splitter = new RecursiveTextSplitter()

	const paragraphChunks = splitter["splitRecursively"](
		`React

Hooks

Context`,
		["\n\n", "\n", " ", ""]
	)

	console.log(paragraphChunks)

	console.log("\n=================================")
	console.log("TEST 2: Character fallback")
	console.log("=================================")

	const characterChunks = splitter["splitRecursively"](
		"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		["\n\n", "\n", " ", ""]
	)

	console.log(characterChunks)

	console.log("\n=================================")
	console.log("TEST 3: Real markdown file")
	console.log("=================================")

	const markdown = readFileSync("./docs/knowledge-base-test.md", "utf-8")

	const markdownChunks = splitter["splitRecursively"](markdown, ["\n\n", "\n", " ", ""])

	console.log(`Total chunks: ${markdownChunks.length}`)

	markdownChunks.forEach((chunk, index) => {
		console.log(`\nChunk ${index + 1}`)
		console.log("---------------------------------")
		console.log(chunk)
	})
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
