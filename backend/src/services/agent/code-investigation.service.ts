import type {
	IListFilesResult,
	IReadFileResult,
	ISearchTextResult,
	ISearchTextToolResult
} from "../../shared/interfaces/ai-tools.interface.js"
import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"
import type { PromptBuilderService } from "../rag/prompt-builder.service.js"
import type { ToolRegistry } from "../tools/tool-registry.service.js"

const MAX_IMPLEMENTATION_CONTEXT_CHARS = 30_000

export interface ICodeInvestigationResult {
	content: string
	file: string
}

export class CodeInvestigationService {
	constructor(
		private readonly toolRegistry: ToolRegistry,
		private readonly llmService: ILLMService,
		private readonly promptBuilder: PromptBuilderService
	) {}

	async showImplementation(target: string): Promise<ICodeInvestigationResult> {
		const normalizedTarget = target.trim()
		const file = await this.findImplementationFile(normalizedTarget)

		if (!file) {
			return {
				content: `${normalizedTarget} not found`,
				file: ""
			}
		}

		const fileResult = await this.toolRegistry.execute<IReadFileResult>({
			action: EAgentAction.READ_FILE,
			args: { path: file }
		})
		const prompt = this.promptBuilder.buildImplementationPrompt(
			normalizedTarget,
			this.truncateContent(fileResult.content)
		)
		const answer = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})

		return {
			content: answer.content,
			file
		}
	}

	async explainUsage(symbol: string): Promise<ICodeInvestigationResult> {
		if (typeof symbol !== "string") {
			return {
				content: "Symbol is required",
				file: ""
			}
		}

		const searchResult = await this.toolRegistry.execute<ISearchTextToolResult>({
			action: EAgentAction.SEARCH_TEXT,
			args: {
				searchText: symbol
			}
		})
		const prompt = this.promptBuilder.buildUsagePrompt(symbol, searchResult.results)
		const response = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})

		return {
			content: response.content,
			file: ""
		}
	}

	async showSummary(symbol: string): Promise<ICodeInvestigationResult> {
		return {
			content: `Summary investigation is not implemented yet for ${symbol}`,
			file: ""
		}
	}

	async findDefinition(symbol: string): Promise<ICodeInvestigationResult> {
		return {
			content: `Definition investigation is not implemented yet for ${symbol}`,
			file: ""
		}
	}

	private async findImplementationFile(target: string): Promise<string | null> {
		const listFilesResult = await this.toolRegistry.execute<IListFilesResult>({
			action: EAgentAction.LIST_FILES,
			args: { fileName: target }
		})
		const fileByName = this.selectFileByName(listFilesResult, target)

		if (fileByName) {
			return fileByName
		}

		const searchResult = await this.toolRegistry.execute<ISearchTextToolResult>({
			action: EAgentAction.SEARCH_TEXT,
			args: {
				searchText: target,
				maxResults: 10
			}
		})
		const firstMatch = this.selectBestMatch(searchResult.results, target)

		return firstMatch?.file ?? null
	}

	private selectFileByName(result: IListFilesResult, target: string): string | null {
		const lowerTarget = target.toLowerCase()

		return (
			result.files.find((file) => file.toLowerCase().includes(`${lowerTarget}.`)) ??
			result.files.find((file) => file.toLowerCase().includes(lowerTarget)) ??
			null
		)
	}

	private truncateContent(content: string): string {
		if (content.length <= MAX_IMPLEMENTATION_CONTEXT_CHARS) {
			return content
		}

		return `${content.slice(0, MAX_IMPLEMENTATION_CONTEXT_CHARS)}

    [Content truncated: ${content.length - MAX_IMPLEMENTATION_CONTEXT_CHARS} characters omitted]`
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	}

	private selectBestMatch(
		results: ISearchTextToolResult["results"],
		target: string
	): ISearchTextResult | undefined {
		const declarationPattern = new RegExp(
			`\\b(class|function|interface|type|const|let|var)\\s+${this.escapeRegExp(target)}\\b`
		)

		return (
			results.find((result) =>
				result.occurrences.some((occurrence) => declarationPattern.test(occurrence.text))
			) ?? results[0]
		)
	}
}
