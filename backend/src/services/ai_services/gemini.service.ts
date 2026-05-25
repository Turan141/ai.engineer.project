import { config } from "../config/config.js"
import { GoogleGenAI } from "@google/genai"
import type { IGenerateParams, ILLMProvider } from "../types/chat.types.js"

export class GeminiService implements ILLMProvider {
	private genAI: GoogleGenAI

	constructor() {
		this.genAI = new GoogleGenAI({
			apiKey: config.geminiApiKey || ""
		})
	}

	async generate(params: IGenerateParams): Promise<string> {
		try {
			const response = await this.genAI.models.generateContent({
				model: "gemini-3.5-flash",
				contents: params.messages
			})

			if (!response || !response.candidates || response.candidates.length === 0) {
				throw new Error("No response from Gemini API")
			}

			const aiAnswer = response.text

			if (!aiAnswer) {
				throw new Error("Gemini API response is empty")
			}

			return aiAnswer
		} catch (error) {
			console.error("Error generating content with Gemini API:", error)
			throw new Error("Failed to generate content with Gemini API", { cause: error })
		}
	}

	generateStream(params: IGenerateParams): AsyncIterable<{ text: string }> {
		throw new Error("Not implemented")

		// try {
		// 	return this.genAI.models.generateContentStream({
		// 		model: "gemini-2.5-flash",
		// 		contents: params.messages
		// 	})
		// } catch (error) {
		// 	console.error("Error generating content stream with Gemini API:", error)
		// 	throw new Error("Failed to generate content stream with Gemini API", {
		// 		cause: error
		// 	})
		// }
	}
}
