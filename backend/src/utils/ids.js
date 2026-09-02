import { randomUUID } from 'node:crypto'

/**
 * Prefixed ids that mirror the frontend convention (e.g. `ins-a1b2c3d`).
 * Uses a slice of a UUID for uniqueness.
 */
export const uid = (prefix) => `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 12)}`

export default uid
