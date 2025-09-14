import { Pool, PoolClient } from 'pg'

let sharedPool: Pool | null = null
let schemaEnsured = false

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.DB_URL && process.env.DB_USER && process.env.DB_PASSWORD)
  )
}

export function getPool(): Pool {
  if (sharedPool) {
    return sharedPool
  }

  const connectionString = process.env.DATABASE_URL || process.env.DB_URL

  if (!connectionString) {
    throw new Error('Database URL is not configured')
  }

  sharedPool = new Pool({
    connectionString,
    ssl: shouldUseSSL() ? { rejectUnauthorized: false } : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  return sharedPool
}

function shouldUseSSL(): boolean {
  // Heroku Postgres typically requires SSL; local dev does not
  if (process.env.DATABASE_URL) return true
  if (process.env.DB_SSL === 'true') return true
  return false
}

export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return
  if (!isDatabaseConfigured()) return

  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS beta_signups (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // Unique index on lower(email) to make it case-insensitive
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_beta_signups_email_lower ON beta_signups ((LOWER(email)));`
    )

    schemaEnsured = true
  } finally {
    client.release()
  }
}

export interface BetaSignupRow {
  id: number
  username: string
  email: string
  created_at: string
}

export async function findBetaSignupByEmail(
  email: string
): Promise<BetaSignupRow | null> {
  if (!isDatabaseConfigured()) return null
  const pool = getPool()
  const { rows } = await pool.query<BetaSignupRow>(
    'SELECT id, username, email, created_at FROM beta_signups WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  )
  return rows[0] || null
}

export async function insertBetaSignup(
  username: string,
  email: string
): Promise<BetaSignupRow> {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured')
  }
  const pool = getPool()
  const { rows } = await pool.query<BetaSignupRow>(
    'INSERT INTO beta_signups (username, email) VALUES ($1, $2) RETURNING id, username, email, created_at',
    [username, email]
  )
  if (!rows[0]) {
    throw new Error('Failed to insert beta signup')
  }
  return rows[0]!
}

