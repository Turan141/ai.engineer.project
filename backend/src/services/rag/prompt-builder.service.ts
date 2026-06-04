import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type {
	IReadFileResult,
	ISearchTextResult,
	ISearchTextToolResult
} from "../../shared/interfaces/ai-tools.interface.js"
import type { IChatMessage, ISearchResult } from "../../types/chat.types.js"

export class PromptBuilderService {
	buildImplementationPrompt(symbol: string, code: string): string {
		return `
						You are a senior TypeScript engineer.
						Analyze implementation of:
						${symbol}
						Provide:
						1. Purpose
						2. Main responsibilities
						3. Important methods
						4. Dependencies
						5. Summary
						Code:
						<code>
						${code}
						</code>`
	}

	buildAgentPrompt(message: string): string {
		return `
						You are a software engineering agent.
						
						IMPORTANT:
						Answer in the same language as the user's question.

						Respond ONLY with valid JSON.
						Available actions:
						{
							"action": "chat"
						}
						{
							"action": "replace_text",
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
								"searchText": "AgentService",
								"targetPath": "optional/path",
								"maxResults": 50
							}
						}
						{
							"action": "explain_usage",
							"args": {
								"symbol": "AgentService"
							}
						}
						{
							"action": "explain_simple",
							"args": {
								"symbol": "AgentService"
							}
						}
						Show implementation of AgentService
						{
							"action": "investigate",
							"args": {
								"target": "AgentService",
								"intent": "implementation"
							}
						}

						How does AgentService work?
						{
							"action": "investigate",
							"args": {
								"target": "AgentService",
								"intent": "implementation"
							}
						}

						Explain UserService implementation
						{
							"action": "investigate",
							"args": {
								"target": "UserService",
								"intent": "implementation"
							}
						}

						Rules:
						- Use chat for general conversation and when information is missing.
						- Use read_file when the user asks to read a specific file.
						- Use explain_usage when the user asks to explain how a specific symbol works or is used.

						Use search_text when user wants raw search results.
							Examples:
							User: "найди AgentService"
							=> search_text
							User: "найди строку AgentService"
							=> search_text
							User: "найди текст AgentService"
							=> search_text

						Use replace_text only when the user explicitly requests file modification.
							- If information is missing, use chat.
							- Never output markdown.
							- Never output explanations.
							- Return exactly one JSON object.

						Use explain_simple when the user asks for a simple explanation of a symbol without technical details.
							- Provide a brief and clear explanation.
							- Avoid technical jargon.
							- Focus on the purpose and usage of the symbol.
							Examples:
							User: "что такое AgentService?"
							=> explain_simple
							User: "объясни AgentService простыми словами"
							=> explain_simple

						Use explain_usage when the user asks:
							- where is used
							- how is used
							- explain usage
							- где используется
							- как используется
							- покажи использование

						Use list_files when the user asks:
							- find file
							- search file
							- locate file
							- show files
							- list files

						Use search_text only when the user explicitly wants to search text occurrences.
						When using search_text, include targetPath if the user names a folder or area.
						Use maxResults only when the user asks for a specific limit; otherwise omit it.

						Examples:

						User: "найди AgentService"
						=> search_text

						User: "где используется AgentService"
						=> explain_usage

						User: "как используется AgentService"
						=> explain_usage

						IMPORTANT:
						Answer using the language of the user's original question.
						Never switch languages unless the user explicitly requests it.
						Always answer in the same language as this user message:
						User message:
						${message}
					`
	}

	buildAnalysisPrompt(
		symbol: string,
		results: ISearchTextResult[],
		isSimple: boolean
	): string {
		const occurrencesText = results
			.map(
				(result) => `
					FILE: ${result.file}

					${result.occurrences.map((o) => `Line ${o.line}: ${o.text}`).join("\n")}
					`
			)
			.join("\n\n")

		if (isSimple) {
			return `
							You are a senior software engineer explaining a codebase.

							IMPORTANT:
							Answer in the same language as the user's question.

							Symbol: ${symbol}

							Search results:

							${occurrencesText}

							Answer in plain language for a developer.

							Requirements:
							- Maximum 5 sentences.
							- Do not list every file.
							- Do not produce a report.
							- Do not produce markdown sections.
							- Focus on the purpose of the symbol.
							- Explain why it exists.
							- Explain how it is used in the project.
							- If the symbol is a service, explain what responsibility it has.

							Good examples:
							"AgentService is the central coordinator for the AI agent. It receives user requests, decides which action should be performed, and invokes tools such as file search, file reading, or text replacement. Other parts of the application create and use this service through dependency injection."
							"AgentService отвечает за координацию действий AI агента. Он принимает запросы от пользователя, решает, какое действие нужно выполнить, и вызывает инструменты, такие как поиск по файлам, чтение файлов или замена текста. Другие части приложения создают и используют этот сервис через dependency injection."

							Bad examples:
							"AgentService is a class defined in src/services/agent/agent.service.ts. It has methods such as handle and explainUsage. It uses llmService, promptBuilderService, and searchTextTool."
							"AgentService - это класс, определенный в src/services/agent/agent.service.ts. Он имеет методы, такие как handle и explainUsage. Он использует llmService, promptBuilderService и searchTextTool."

							Use the language of the user's original question.
							Return only the explanation.
							`
		}

		return `
							You are analyzing source code.
							IMPORTANT:
							Answer in the same language as the user's question.

							Symbol: ${symbol}

							Occurrences:

							${occurrencesText}

							Tasks:

							1. List all files where the symbol appears.
							2. Explain why it appears in each file.
							3. Classify occurrences as:
								- declaration
								- import
								- dependency injection
								- usage
							4. Provide a concise technical summary.

							Use markdown.
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
