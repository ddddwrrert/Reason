/**
 * Claim ledger paths under run/claim/ (旁路; never inside evaluate).
 */

import { join } from 'node:path'

export const CLAIM_DIR = 'claim'

/**
 * @param {string} runRoot
 */
export function claimRoot(runRoot) {
  return join(runRoot, CLAIM_DIR)
}

/**
 * @param {string} runRoot
 */
export function claimPaths(runRoot) {
  const root = claimRoot(runRoot)
  return {
    root,
    events: join(root, 'events.jsonl'),
    rPlus: join(root, 'r_plus.json'),
    rMinus: join(root, 'r_minus.json'),
    loci: join(root, 'loci.json'),
    tips: join(root, 'tips.json'),
  }
}

/** Discrete search loci used by Reason (offline + DSH). */
export const DEFAULT_LOCI = Object.freeze([
  'repair',
  'structure',
  'depth',
  'speed',
])
