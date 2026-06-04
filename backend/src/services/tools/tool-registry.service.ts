import type { IAgentDecision } from "../../shared/interfaces/agent.interface.js"
import type { ITool } from "../../shared/interfaces/ai-tools.interface.js"

export class ToolRegistry {
	private readonly tools = new Map<string, ITool>()

	constructor(tools: ITool[] = []) {
		tools.forEach((tool) => this.register(tool))
	}

	register(tool: ITool): void {
		if (this.tools.has(tool.name)) {
			throw new Error(`Tool ${tool.name} is already registered`)
		}

		this.tools.set(tool.name, tool)
	}

	get(name: string): ITool | undefined {
		return this.tools.get(name)
	}

	async execute<TResult = unknown>(decision: IAgentDecision): Promise<TResult> {
		return this.executeTool<TResult>(decision.action, decision.args)
	}

	async executeTool<TResult = unknown>(name: string, args: unknown): Promise<TResult> {
		const tool = this.get(name)

		if (!tool?.execute) {
			throw new Error(`Unsupported tool: ${name}`)
		}

		return tool.execute(args) as Promise<TResult>
	}
}
