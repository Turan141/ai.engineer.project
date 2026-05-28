import { sqLiteService } from "./dependencies.js"

export async function initializeApplication(): Promise<void> {
	console.log("Initializing application...")
	sqLiteService.initialize()
	console.log("Application initialized")
}
