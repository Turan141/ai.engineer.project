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
	intent: "implementation"
}
