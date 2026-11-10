/**
 * Stable tip / claim hashes (no crypto dependency).
 */

import { createHash } from 'node:crypto'

/**
 * @param {string|object} value
 * @returns {string}
 */
export function tipHash(value) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value)
  return createHash('sha256').update(raw).digest('hex').slice(0, 16)
}
