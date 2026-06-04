import type { IAgentMemory } from "../../shared/interfaces/memory.interface.js"
import type { ICodePatch } from "../../shared/interfaces/planner.interface.js"

export class PatchService {
	constructor(private readonly agentPatchMemory: IAgentMemory) {}

	async savePendingPatch(sessionId: string, patch: ICodePatch): Promise<void> {
		await this.agentPatchMemory.set(sessionId, patch)
	}

	async getPendingPatch(sessionId: string): Promise<ICodePatch | undefined> {
		return this.agentPatchMemory.get(sessionId)
	}

	async hasPendingPatch(sessionId: string): Promise<boolean> {
		const patch = await this.getPendingPatch(sessionId)
		return !!patch
	}

	async clearPendingPatch(sessionId: string): Promise<void> {
		await this.agentPatchMemory.delete(sessionId)
	}
}
