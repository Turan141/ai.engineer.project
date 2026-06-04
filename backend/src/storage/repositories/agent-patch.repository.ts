import type { IAgentMemory } from "../../shared/interfaces/memory.interface.js"
import type { ICodePatch } from "../../shared/interfaces/planner.interface.js"

export class AgentPatchMemory implements IAgentMemory {
	private patches: Map<string, ICodePatch> = new Map()

	async set(sessionId: string, patch: ICodePatch): Promise<void> {
		this.patches.set(sessionId, patch)
	}
	async get(sessionId: string): Promise<ICodePatch | undefined> {
		return this.patches.get(sessionId)
	}
}
