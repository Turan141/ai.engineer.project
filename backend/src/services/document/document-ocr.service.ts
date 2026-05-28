import { spawn } from "child_process"

export class DocumentOCRService {
	async extractText(filePath: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const process = spawn("python", ["./python/ocr.py", filePath])

			let result = ""
			let error = ""

			process.stdout.on("data", (data) => {
				result += data.toString()
			})

			process.stderr.on("data", (data) => {
				error += data.toString()
			})

			process.on("close", (code) => {
				if (code === 0) {
					resolve(result.trim())
					return
				} else {
					reject(new Error(`OCR process exited with code ${code}: ${error}`))
				}
				resolve(result)
			})
		})
	}
}
