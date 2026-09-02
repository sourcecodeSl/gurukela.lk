import app from './app.js'
import env from './config/env.js'
import { pool } from './config/db.js'

async function start() {
  try {
    // Fail fast if the database is unreachable.
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    console.log(`[db] connected to ${env.db.host}:${env.db.port}/${env.db.database}`)
  } catch (err) {
    console.error('[db] connection failed:', err.message)
    console.error('    Check that MySQL (XAMPP) is running and .env is correct.')
    process.exit(1)
  }

  // Bind on all interfaces so cPanel/Passenger (and Docker) can reach it.
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[server] gurukela.lk API listening on port ${env.port}`)
    console.log(`[server] health check: /api/health`)
  })
}

start()
