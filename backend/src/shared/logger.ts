import pino from "pino"

export const logger = pino({
	level: process.env.LOG_LEVEL ?? "info"
})

/** Create a child logger scoped to a specific module */
export const createLogger = (module: string) => logger.child({ module })
