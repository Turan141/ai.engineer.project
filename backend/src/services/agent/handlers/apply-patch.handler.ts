import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentContext,
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"
import type { FileSystemService } from "../../tools/file-system/file-system.service.js"
import type { PatchService } from "../patch.service.js"

export class ApplyPatchHandler implements IAgentHandler {
	readonly action = EAgentAction.APPROVE_PATCH

	constructor(
		private readonly patchService: PatchService,
		private readonly fileSystemService: FileSystemService
	) {}

	async execute(
		_decision: IAgentDecision,
		context: IAgentContext
	): Promise<IAgentResponse> {
		const patch = await this.patchService.getPendingPatch(context.sessionId)

		if (!patch) {
			return {
				type: "assistant_message",
				action: this.action,
				content: "No pending patch found for this session."
			}
		}

		await this.fileSystemService.writeFile(patch.filePath, patch.modifiedCode)
		await this.patchService.clearPendingPatch(context.sessionId)

		return {
			type: "assistant_message",
			action: this.action,
			content: `Patch applied: ${patch.summary}`,
			metadata: {
				file: patch.filePath,
				patch
			}
		}
	}
}
