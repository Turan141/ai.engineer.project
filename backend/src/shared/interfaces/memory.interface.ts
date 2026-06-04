import type { ICodePatch } from "./planner.interface.js"

export interface IAgentMemory {
	get(sessionId: string): Promise<ICodePatch | undefined>
	set(sessionId: string, patch: ICodePatch): Promise<void>
}
