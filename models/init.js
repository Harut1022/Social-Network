import Database from 'better-sqlite3'
const db = new Database("social.db")

db.exec(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,
        login TEXT,
        password TEXT,
        picture TEXT
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS SESSION(
        id TEXT PRIMARY KEY,
        userId INTEGER,
        expires INTEGER,
        FOREIGN KEY(userId) REFERENCES users(id)
    )    
`)

export default db