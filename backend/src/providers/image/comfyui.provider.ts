import fs from "fs"
import type {
	IGenerateImageParams,
	IGenerateImageProviderQuery,
	IGenerateImageProviderQueryResult,
	IGenerateImageProviderResult,
	IImageProvider
} from "../../shared/interfaces/image.interfaces.js"
import { config } from "../../config/config.js"

export class ComfyUIProvider implements IImageProvider {
	private readonly DEFAULT_WORKFLOW = "./docs/workflows/sdxl_simple_default.json"

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	private async waitForCompletion(
		promptId: string,
		signal?: AbortSignal
	): Promise<IGenerateImageProviderQueryResult> {
		while (true) {
			const response = await fetch(`${config.comfyUIBaseUrl}/history`, {
				method: "GET"
			})
			console.log(response)
			if (!response.ok) {
				throw new Error(`Failed to check prompt status: ${response.statusText}`)
			}

			const data = await response.json()
			const task = data[promptId]

			if (!!task?.status?.completed && !!task?.outputs?.["19"]?.images?.length) {
				return task.outputs["19"]?.images[0] as IGenerateImageProviderQueryResult
			}
			await this.delay(2500)
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
			// ...(signal ? { signal } : {}), todo handle abort signal properly

			body: JSON.stringify({
				prompt: {
					...workflow
				}
			})
		})

		if (!response.ok) {
			throw new Error(`Failed to generate image: ${response.statusText}`)
		}

		const data: IGenerateImageProviderQuery = await response.json()
		const promptId = data.prompt_id
		const generatedImg = await this.waitForCompletion(promptId, signal)
		console.log(generatedImg)
		return {
			fileName: generatedImg.filename
		}
	}
}
