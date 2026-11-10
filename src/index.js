/**
 * dsh-evolve-reason — Cordis companion for dsh-evolve-loop (optional).
 * Opt-in via DSH_EVOLVE_REASON=1. Does not edit upstream evolve-loop sources.
 *
 * Standalone (no DSH): `node bin/reason-run.js`
 *
 * @module dsh-evolve-reason
 */

import { installReasonProviders, requested } from './install.js'

export const name = 'dsh-evolve-reason'
export const inject = ['evolve']

/**
 * @param {object} ctx
 */
export function apply(ctx) {
  if (!requested()) return
  const evolve = ctx.evolve
  ctx.effect(() => installReasonProviders(evolve).dispose)
}

export { requested, ENV_FLAG, installReasonProviders } from './install.js'
export { createStandaloneEvolve } from './standalone/harness.js'
