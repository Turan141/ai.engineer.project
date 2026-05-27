import { config } from "../../config/config.js"
import type {
	IGenerateParams,
	ILLMProvider,
	ILMStudioResponse
} from "../../types/chat.types.js"

export class LMStudioService implements ILLMProvider {
	async generate(params: IGenerateParams, signal?: AbortSignal): Promise<string> {
		const { messages } = params

		const response = await fetch(`${config.lmstudioBaseUrl}/v1/chat/completions`, {
			method: "POST",
			...(signal ? { signal } : {}),
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: config.llmModel,
				messages
			})
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error("LMStudio API error:", errorText)
			throw new Error(`LMStudio API error: ${response.status} ${response.statusText}`)
		}
		const data: ILMStudioResponse = await response.json()
		if (!data.choices || data.choices.length === 0) {
			throw new Error("LMStudio API response has no choices")
		}

		const aiAnswer = data.choices[0]?.message

		if (!aiAnswer || !aiAnswer.content) {
			throw new Error("LMStudio response content is missing")
		}

		return aiAnswer.content
	}

	async *generateStream(
		params: IGenerateParams,
		signal?: AbortSignal
	): AsyncIterable<{ text: string }> {
		const { messages } = params
		const response = await fetch(`${config.lmstudioBaseUrl}/v1/chat/completions`, {
			method: "POST",
			...(signal ? { signal } : {}),
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: config.llmModel,
				messages,
				stream: true
			})
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error("LMStudio API error:", errorText)
			throw new Error(`LMStudio API error: ${response.status} ${response.statusText}`)
		}

		if (!response.body) {
			throw new Error("LMStudio API response has no body")
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder()

		let buffer = ""

		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				break
			}

			buffer += decoder.decode(value, { stream: true })

			const events = buffer.split("\n\n")

			buffer = events.pop() || ""

			for (const event of events) {
				if (signal?.aborted) {
					return
				}

				if (done) {
					return
				}

				if (!event.startsWith("data: ")) {
					continue
				}

				const jsonStr = event.replace("data: ", "").trim()

				if (!jsonStr) {
					continue
				}

				if (jsonStr === "[DONE]") {
					return
				}

				try {
					const json = JSON.parse(jsonStr)
					const content = json.choices?.[0]?.delta?.content

					if (content) {
						yield { text: content }
					}
				} catch (error) {
					throw new Error("Invalid JSON received from LM Studio stream")
				}
			}
		}
	}
}
