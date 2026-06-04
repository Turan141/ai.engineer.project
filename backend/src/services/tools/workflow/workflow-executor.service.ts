import type { IAgentPlan } from "../../../shared/interfaces/planner.interface.js"
import type { ToolRegistry } from "../tool-registry.service.js"

export class WorkflowExecutor {
	constructor(private readonly toolRegistry: ToolRegistry) {}

	async execute(plan: IAgentPlan): Promise<unknown[]> {
		const results: unknown[] = []

		for (const step of plan.steps) {
			const result = await this.toolRegistry.executeTool(step.tool, step.args)
			results.push(result)
		}

		return results
	}
}
