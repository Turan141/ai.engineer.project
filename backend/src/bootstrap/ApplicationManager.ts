import { knowledgeBase, sqLiteService } from "./dependencies.js"

export async function initializeApplication(): Promise<void> {
	console.log("Initializing application...")
	await knowledgeBase.initialize()
	sqLiteService.initialize()
	console.log("Application initialized")
}
