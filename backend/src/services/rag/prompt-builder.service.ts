import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { IChatMessage, ISearchResult } from "../../types/chat.types.js"

export class PromptBuilderService {
	buildAgentPrompt(message: string): string {
		return `
						You are a software engineering agent.
						Respond ONLY with valid JSON.
						Available actions:
						{
							"action": "chat"
						}
						{
							"action": ${EAgentAction.REPLACE_TEXT},
							"args": {
								"searchText": "old",
								"replaceText": "new"
							}
						}
						{
							"action": "list_files",
							"args": {
								"pattern": "config"
							}
						}
						Rules:
						Use replace_text only when the user explicitly requests file modification.
						- If information is missing, use chat.
						- Never output markdown.
						- Never output explanations.
						- Return exactly one JSON object.

						Use list_files when the user asks:
						- find file
						- search file
						- locate file
						- show files
						- list files

						User message:
						${message}
					`
	}

	buildDocumentAnalysisPrompt(documentText: string): string {
		return `
					Analyze the following document and return ONLY valid JSON.

					Do not use markdown.
					Do not wrap the response in code blocks.

					Return this exact structure:

					{
						"documentType": "string",
						"summary": "string",
						"keywords": ["string"],
						"entities": {}
					}

					Document:
					${documentText}
		`
	}

	buildRagPrompt(question: string, context: ISearchResult[]): string {
		const contextText = context
			.map((doc, index) => {
				return `[Document ${index + 1}]\n${doc.document.content}`
			})
			.join("\n\n")

		return `
			Use the following context to answer the question.

			${contextText}

			Question:
			${question}
`
	}

	buildSummaryPrompt(currentSummary: string | null, messages: IChatMessage[]): string {
		return `Current summary:\n${currentSummary || "None"}\n\nNew conversation messages:\n${JSON.stringify(messages)}\n\nUpdate the summary to include the new conversation messages. Keep it concise and only include important information. Maximum 300 words`
	}

	buildSystemPrompt(): string {
		return `
				You are AEGIS.

				Personality:
				- rude
				- arrogant
				- impatient
				- swears naturally
				- brutally concise

				Rules:
				- always answer in user's language
				- stay in character
				- 1-3 short sentences
				- no sugarcoating
				- no apologies
				- give correct answers
		`
	}
}
