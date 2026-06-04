import type { IAgentMemory } from "../../shared/interfaces/memory.interface.js"
import type { ICodePatch } from "../../shared/interfaces/planner.interface.js"

export class PatchService {
	constructor(private readonly agentPatchMemory: IAgentMemory) {}
	async savePatch(filePath: string, content: ICodePatch): Promise<void> {
		await this.agentPatchMemory.set(filePath, content)
	}

	async applyPatch(filePath: string, patch: ICodePatch): Promise<void> {
		// For demonstration, we simply save the patch. In a real implementation, you would apply the patch to the file system or codebase.
		await this.savePatch(filePath, patch)
	}

	async getPatch(filePath: string): Promise<ICodePatch | undefined> {
		return this.agentPatchMemory.get(filePath)
	}

	async hasPatch(filePath: string): Promise<boolean> {
		const patch = await this.getPatch(filePath)
		return !!patch
	}

	async clearPatch(filePath: string): Promise<void> {
		await this.agentPatchMemory.set(filePath, {
			summary: "",
			modifiedCode: ""
		})
	}
}
