export type InvestigateIntent =
	| "implementation"
	| "usage"
	| "definition"
	| "summary"
	| "modification"
	| "refactor"

export type InvestigateMode = "simple" | "detailed"

export interface IPlanStep {
	tool: string
	args: unknown
}

export interface IAgentPlan {
	steps: IPlanStep[]
}

export interface IExecutionContext {
	previousResults: unknown[]
}

export interface IInvestigateArgs {
	target: string
	intent: InvestigateIntent
	mode?: InvestigateMode
}

export interface IModifyArgs {
	target: string
	task: string
}

export interface ICodePatch {
	filePath: string
	summary: string
	modifiedCode: string
}
