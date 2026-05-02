import sqlite3 from 'sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_DIR = join(__dirname, '../../data')
const DB_PATH = join(DB_DIR, 'colour-match.db')

mkdirSync(DB_DIR, { recursive: true })

const db = new sqlite3.Database(DB_PATH)

// Promisified helpers
export const run   = (sql, params = []) => new Promise((res, rej) =>
  db.run(sql, params, function(err) { err ? rej(err) : res({ lastID: this.lastID, changes: this.changes }) }))
export const get   = (sql, params = []) => new Promise((res, rej) =>
  db.get(sql, params, (err, row) => err ? rej(err) : res(row)))
export const all   = (sql, params = []) => new Promise((res, rej) =>
  db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)))

// Init schema
async function migrate() {
  await run('PRAGMA journal_mode = WAL')
  await run('PRAGMA foreign_keys = ON')

  await run(`CREATE TABLE IF NOT EXISTS printers (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS custom_inks (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    c    REAL NOT NULL DEFAULT 0,
    m    REAL NOT NULL DEFAULT 0,
    y    REAL NOT NULL DEFAULT 0,
    k    REAL NOT NULL DEFAULT 0,
    o    REAL NOT NULL DEFAULT 0,
    g    REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS colour_jobs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER REFERENCES printers(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    target_l   REAL NOT NULL,
    target_a   REAL NOT NULL,
    target_b   REAL NOT NULL,
    notes      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS match_attempts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id         INTEGER NOT NULL REFERENCES colour_jobs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    c    REAL NOT NULL DEFAULT 0,
    m    REAL NOT NULL DEFAULT 0,
    y    REAL NOT NULL DEFAULT 0,
    k    REAL NOT NULL DEFAULT 0,
    o    REAL NOT NULL DEFAULT 0,
    g    REAL NOT NULL DEFAULT 0,
    result_l REAL,
    result_a REAL,
    result_b REAL,
    delta_e  REAL,
    delta_l  REAL,
    delta_a  REAL,
    delta_b  REAL,
    passed   INTEGER DEFAULT 0,
    notes    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS calibration_patches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
    print_mode TEXT NOT NULL DEFAULT 'surface',
    patch_ref  INTEGER NOT NULL,
    c    REAL NOT NULL,
    m    REAL NOT NULL,
    y    REAL NOT NULL,
    k    REAL NOT NULL,
    o    REAL NOT NULL,
    g    REAL NOT NULL,
    measured_l REAL,
    measured_a REAL,
    measured_b REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(printer_id, print_mode, patch_ref)
  )`)

  // Add print_mode column if upgrading from older schema
  try {
    await run(`ALTER TABLE calibration_patches ADD COLUMN print_mode TEXT NOT NULL DEFAULT 'surface'`)
  } catch { /* column already exists */ }

  // Seed default printer
  const count = await get('SELECT COUNT(*) as n FROM printers')
  if (count.n === 0) {
    await run("INSERT INTO printers (name) VALUES ('Roland VersaCAMM')")
  }
}

export { migrate }
export default db
