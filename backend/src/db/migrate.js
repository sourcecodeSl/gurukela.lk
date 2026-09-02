import mysql from 'mysql2/promise'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import env from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Create the database if missing and run schema.sql.
 * `--fresh` drops and recreates the database first.
 */
async function migrate() {
  const fresh = process.argv.includes('--fresh')

  const root = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  })

  if (fresh) {
    await root.query(`DROP DATABASE IF EXISTS \`${env.db.database}\``)
    console.log(`[migrate] dropped database ${env.db.database}`)
  }
  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
  )
  await root.changeUser({ database: env.db.database })
  console.log(`[migrate] using database ${env.db.database}`)

  const schema = await fs.readFile(path.resolve(__dirname, 'schema.sql'), 'utf8')
  await root.query(schema)
  console.log('[migrate] schema applied')

  await root.end()
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] failed:', err)
    process.exit(1)
  })
