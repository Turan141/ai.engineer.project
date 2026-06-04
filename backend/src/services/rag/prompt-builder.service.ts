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

							* Answer in the same language as the user's question.
							* Respond ONLY with valid JSON.
							* Never output markdown.
							* Never output explanations.
							* Return exactly one JSON object.

							Available actions:

							{
							"action": "chat"
							}

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "implementation"
							}
							}

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							{
							"action": "list_files",
							"args": {
							"fileName": "AgentService"
							}
							}

							{
							"action": "read_file",
							"args": {
							"path": "src/services/agent/agent.service.ts"
							}
							}

							{
							"action": "search_text",
							"args": {
							"searchText": "AgentService"
							}
							}

							{
							"action": "replace_text",
							"args": {
							"searchText": "old",
							"replaceText": "new"
							}
							}
							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "review"
							}
							}

							Intent meanings:

							implementation:

							* show implementation
							* explain implementation
							* how does it work
							* what does this class do
							* explain this service
							* покажи реализацию
							* объясни реализацию
							* как работает
							* что делает

							usage:

							* where is used
							* how is used
							* who uses it
							* show usages
							* find usages
							* explain usage
							* где используется
							* как используется
							* покажи использование
							* найди использование

							Examples:

							User: Show implementation of AgentService

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "implementation"
							}
							}

							User: How does AgentService work?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "implementation"
							}
							}

							User: What does AgentService do?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "implementation"
							}
							}

							User: Explain UserService implementation

							{
							"action": "investigate",
							"args": {
							"target": "UserService",
							"intent": "implementation"
							}
							}

							User: Покажи реализацию AgentService

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "implementation"
							}
							}

							User: Что делает AgentService?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "implementation"
							}
							}

							User: Where is AgentService used?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							User: How is AgentService used?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							User: Find usages of AgentService

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							User: Где используется AgentService?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							User: Как используется AgentService?

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							User: Найди использование AgentService

							{
							"action": "investigate",
							"args": {
							"target": "AgentService",
							"intent": "usage"
							}
							}

							User: Найди AgentService

							{
							"action": "search_text",
							"args": {
							"searchText": "AgentService"
							}
							}

							User: Найди текст AgentService

							{
							"action": "search_text",
							"args": {
							"searchText": "AgentService"
							}
							}

							User: Read src/services/agent/agent.service.ts

							{
							"action": "read_file",
							"args": {
							"path": "src/services/agent/agent.service.ts"
							}
							}

							User: Replace old with new

							{
							"action": "replace_text",
							"args": {
							"searchText": "old",
							"replaceText": "new"
							}
							}

							User: Refactor AgentService, 
							User: Fix bug in AgentService
							User: Improve AgentService
							User: Add logging to AgentService
							{
								"action": "modify",
								"args": {
									"target": "AgentService",
									"task": "Refactor AgentService"
								}
							}

							User: Add error handling to AgentService
							{
								"action": "modify",
								"args": {
									"target": "AgentService",
									"task": "Add error handling"
								}
							}

							Rules:

							* Use investigate for implementation and usage questions.
							* Use search_text only when the user explicitly asks to search text.
							* Use read_file only when the user explicitly asks to read a file.
							* Use replace_text only when the user explicitly asks to modify code.
							* Use chat when information is missing.
							* Return exactly one JSON object.

							User message:

							${message}
							`
	}

	buildUsagePrompt(symbol: string, results: ISearchTextResult[]): string {
		const occurrencesText = results
			.map(
				(result) => `
FILE: ${result.file}

${result.occurrences.map((o) => `Line ${o.line}: ${o.text}`).join("\n")}
`
			)
			.join("\n\n")

		return `
You are a senior TypeScript engineer analyzing source code relationships.

IMPORTANT:
- Answer in the same language as the user's question.
- Focus on usages, dependencies and relationships.
- Do NOT explain implementation details unless necessary.
- Do NOT describe methods unless they help explain usage.
- Only use information visible in the provided occurrences.
- Do NOT invent dependencies.
- If information is insufficient, explicitly say so.

Symbol:
${symbol}

Occurrences:

${occurrencesText}

Tasks:

1. List the files where the symbol appears.
2. Explain why the symbol appears in each file.
3. Classify occurrences as:
   - declaration
   - import
   - dependency injection
   - direct usage
4. Describe the dependency flow based only on the provided occurrences.
5. Explain which parts of the application depend on this symbol.
6. Provide a concise technical summary.

Expected answer format:

## Usage Summary

### File: example.ts
- imported
- injected into constructor

### File: controller.ts
- direct usage
- executes business logic

## Dependency Flow

Describe how the symbol flows through the application.

## Summary

Short technical summary.
Only describe information directly visible in the code.
Do not infer architectural intentions unless they are explicitly present.
If something cannot be determined from the code, state that it is unknown.
Return only the analysis.
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

	buildModificationPrompt(task: string, filePath: string, code: string): string {
		return `
				You are a senior TypeScript backend engineer.

				You are modifying an existing backend codebase.

				Project stack:
				- TypeScript
				- Node.js
				- Express
				- SQLite
				- LM Studio

				Task:
				${task}

				File:
				${filePath}

				Current file content:

				${code}

				CRITICAL RULES:

				- Preserve existing architecture.
				- Preserve existing behavior unless the task explicitly requires behavior changes.
				- Do not introduce React.
				- Do not introduce Vue.
				- Do not introduce Angular.
				- Do not introduce frontend concepts.
				- Do not rewrite classes into functional components.
				- Do not add console.log unless explicitly requested.
				- Do not add comments unless explicitly requested.
				- Do not invent new files.
				- Do not invent dependencies.
				- Do not modify unrelated code.

				REFACTOR RULES:

				If the task is a refactor:

				- Improve readability.
				- Reduce duplication.
				- Extract helper methods when beneficial.
				- Improve naming when clearly beneficial.
				- Simplify control flow.
				- Preserve behavior.
				- Do NOT add logging.
				- Do NOT add comments.
				- Do NOT change architecture.
				- If the file is already simple and no meaningful refactor exists:
				- Return the original code unchanged.
				- Do not invent refactors.
				- Do not rename variables unless it provides a clear benefit.

				BUGFIX RULES:

				If the task is a bug fix:

				- Fix only the requested issue.
				- Keep the solution minimal.
				- Preserve existing APIs.
				- Avoid unrelated refactoring.

				CRITICAL:

				modifiedCode MUST contain the complete file content.
				Never use:
				- "// ... original file content ..."
				- "// unchanged"
				- "same as above"
				- placeholders

				Always return the full file content.

				OUTPUT:

				Return ONLY valid JSON.

				{
					"summary": "short description of the change",
					"modifiedCode": "complete updated file content"
				}

				Requirements:

				- modifiedCode must contain the entire updated file.
				- Return valid JSON only.
				- Do not use markdown.
				- Do not use code fences.
				- Do not include explanations outside JSON.

				If no meaningful improvement can be made:

				{
					"summary": "No meaningful changes required",
					"modifiedCode": "<original file content>"
				}
			`
	}
}
