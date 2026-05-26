import fs from "fs"
import type {
	IGenerateImageParams,
	IGenerateImageProviderResult,
	IImageProvider
} from "../../shared/interfaces/image.interfaces.js"
import { config } from "../../config/config.js"

export class ComfyUIProvider implements IImageProvider {
	private readonly DEFAULT_WORKFLOW = "./shared/workflows/sdxl_simple_default.json"

	async pollServer(promptId: string): Promise<void> {
		try {
			const response = await fetch("/api/data")
			const data = await response.json()
			console.log("Update received:", data)
		} catch (error) {
			console.error("Polling error:", error)
		} finally {
			// Schedule the next poll after 5 seconds
			setTimeout(this.pollServer, 5000)
		}
	}

	async generate(
		params: IGenerateImageParams,
		signal: AbortSignal
	): Promise<IGenerateImageProviderResult> {
		const { prompt } = params

		const workflow = JSON.parse(fs.readFileSync(this.DEFAULT_WORKFLOW, "utf-8"))
		workflow["6"].inputs.text = prompt
		workflow["15"].inputs.text = prompt

		const response = await fetch(`${config.comfyUIBaseUrl}/prompt`, {
			method: "POST",
			...(signal ? { signal } : {}),
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				prompt: {
					...workflow
				}
			})
		})

		if (!response.ok) {
			throw new Error(`Failed to generate image: ${response.statusText}`)
		}

		console.log(response)

		const data = await response.json()
		const promptId = data.prompt_id

		return data
	}
}
