import { knowledgeBase } from "./dependencies.js"

export async function initializeApplication(): Promise<void> {
	console.log("Initializing application...")
	await knowledgeBase.initialize()
	console.log("Application initialized")
}
