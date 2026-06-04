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
import type { CodeInvestigationService } from "../code-investigation.service.js"

const INVESTIGATE_INTENTS: readonly InvestigateIntent[] = [
	"implementation",
	"usage",
	"definition",
	"summary",
	"modification",
	"refactor"
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

		let result

		switch (intent) {
			case "modification":
			case "refactor":
				result = {
					content: `Intent "${intent}" is not implemented yet.`
				}
				break
			case "implementation":
				result = await this.codeInvestigationService.showImplementation(args.target)
				break
			case "usage":
				result = await this.codeInvestigationService.explainUsage(args.target)
				break
			case "summary":
				result = await this.codeInvestigationService.showSummary(args.target)
				break
			case "definition":
				result = await this.codeInvestigationService.findDefinition(args.target)
				break
			default:
				result = {
					type: "assistant_message",
					action: this.action,
					content: `Unknown investigation intent: ${intent}`
				}
		}

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
