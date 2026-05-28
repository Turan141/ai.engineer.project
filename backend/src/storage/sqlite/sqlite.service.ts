import Database from "better-sqlite3"

export class SQLiteService {
	private readonly db: Database.Database

	constructor(path: string = "aegis.db") {
		this.db = new Database(path)
		this.db.pragma("journal_mode = WAL")
	}

	initialize(): void {
		this.createTables()
	}

	getDb(): Database.Database {
		if (!this.db) {
			throw new Error("Database not initialized")
		}
		return this.db
	}

	private createTables(): void {
		if (!this.db) {
			throw new Error("Database not initialized")
		}

		this.db?.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      
      CREATE INDEX IF NOT EXISTS idx_messages_session
      ON messages(session_id);

      CREATE TABLE IF NOT EXISTS summaries (
        session_id TEXT PRIMARY KEY,
        summary TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        preset TEXT,
        created_at INTEGER NOT NULL
      );
    `)
	}
}
