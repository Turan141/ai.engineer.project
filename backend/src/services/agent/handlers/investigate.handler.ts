import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"
import type {
	IInvestigateArgs,
	InvestigateIntent,
	InvestigateMode
} from "../../../shared/interfaces/planner.interface.js"
import type {
	CodeInvestigationService,
	ICodeInvestigationResult
} from "../code-investigation.service.js"

const INVESTIGATE_INTENTS: readonly InvestigateIntent[] = [
	"implementation",
	"usage",
	"definition",
	"summary"
]
const INVESTIGATE_MODES: readonly InvestigateMode[] = ["simple", "detailed"]

export class InvestigateHandler implements IAgentHandler {
	readonly action = EAgentAction.INVESTIGATE

	constructor(private readonly codeInvestigationService: CodeInvestigationService) {}

	async execute(decision: IAgentDecision): Promise<IAgentResponse> {
		const args = this.parseArgs(decision.args)
		if (!args) {
			return {
				type: "chat",
				action: EAgentAction.CHAT
			}
		}
		const intent = args.intent || "implementation"

		const result = await this.executeInvestigation(intent, args.target)

		return {
			type: "assistant_message",
			action: this.action,
			content: result.content,
			...(result.file ? { metadata: { file: result.file } } : {})
		}
	}

	private parseArgs(args: IAgentDecision["args"]): IInvestigateArgs | null {
		if (!args || typeof args.target !== "string" || args.target.trim() === "") {
			return null
		}

		const mode = this.parseMode(args.mode)

		return {
			target: args.target.trim(),
			intent: this.parseIntent(args.intent),
			...(mode ? { mode } : {})
		}
	}

	private executeInvestigation(
		intent: InvestigateIntent,
		target: string
	): Promise<ICodeInvestigationResult> {
		switch (intent) {
			case "implementation":
				return this.codeInvestigationService.showImplementation(target)
			case "usage":
				return this.codeInvestigationService.explainUsage(target)
			case "summary":
				return this.codeInvestigationService.showSummary(target)
			case "definition":
				return this.codeInvestigationService.findDefinition(target)
		}
	}

	private parseIntent(intent: unknown): InvestigateIntent {
		return this.isInvestigateIntent(intent) ? intent : "implementation"
	}

	private parseMode(mode: unknown): InvestigateMode | undefined {
		return this.isInvestigateMode(mode) ? mode : undefined
	}

	private isInvestigateIntent(value: unknown): value is InvestigateIntent {
		return (
			typeof value === "string" &&
			INVESTIGATE_INTENTS.includes(value as InvestigateIntent)
		)
	}

	private isInvestigateMode(value: unknown): value is InvestigateMode {
		return (
			typeof value === "string" && INVESTIGATE_MODES.includes(value as InvestigateMode)
		)
	}
}
