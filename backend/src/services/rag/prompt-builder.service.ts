import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { IReadFileResult } from "../../shared/interfaces/ai-tools.interface.js"
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
						{
							"action": "read_file",
							"args": {
								"path": "src/config/app.config.ts"
							}
						}
							{
							"action": "search_text",
							"args": {
								"searchText": "AgentService"
							}
						}
						{
							"action": "explain_usage",
							"args": {
								"symbol": "AgentService"
							}
						}
						Rules:
						- Use chat for general conversation and when information is missing.
						- Use read_file when the user asks to read a specific file.
						- Use explain_usage when the user asks to explain how a specific symbol works or is used.
						Use search_text when user asks:
							- find usage
							- where is used
							- search text
							- find string
							- найти где используется
							- найти текст
							- найти строку

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
						Use explain_usage when the user asks:

							- where is used
							- how is used
							- explain usage
							- где используется
							- как используется
							- покажи использование

						Use search_text only when the user explicitly wants to search text occurrences.

						Examples:

						User: "найди AgentService"
						=> search_text

						User: "где используется AgentService"
						=> explain_usage

						User: "как используется AgentService"
						=> explain_usage

						User message:
						${message}
					`
	}

	buildAnalysisPrompt(symbol: string, files: IReadFileResult[]): string {
		console.log("Building analysis prompt for symbol:", files)
		return `
						Analyze usage of symbol: ${symbol}

						Files containing this symbol:

						${files
							.map(
								(file) => `
						FILE:
						${file.path}

						CONTENT:
						${file.content}
						`
							)
							.join("\n\n")}

						Tasks:

						1. List all files where the symbol appears.
						2. Explain why it appears in each file.
						3. Distinguish:
							- declaration
							- import
							- dependency injection
							- usage
						4. Return a concise summary.
					`
	}

	buildNextStepPrompt(userRequest: string, toolResult: unknown): string {
		return `
						User request:
						${userRequest}
						Previous tool result:
						${JSON.stringify(toolResult)}
						Decide next action.
						Available actions:
						chat
						read_file
						search_text
						finish
						Return only JSON.
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
