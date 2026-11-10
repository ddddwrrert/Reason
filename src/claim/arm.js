/**
 * Exploit / Explore arm scheduler + anti-starvation.
 *
 * Rules:
 * - Default explore_rate (e.g. 0.35)
 * - If any locus has visits << mean visits (starved), force Explore
 * - Uncertain outcomes do not count as downs for arm pressure
 */

import { DEFAULT_LOCI } from './paths.js'

/**
 * @param {object} state
 * @param {object} [opts]
 * @param {number} [opts.exploreRate=0.35]
 * @param {number} [opts.starveRatio=0.5] - force explore if visits < ratio * mean
 * @param {() => number} [opts.rng]
 * @returns {{ arm: 'exploit'|'explore', reason: string, locus: string }}
 */
export function chooseArm(state, opts = {}) {
  const exploreRate = opts.exploreRate ?? 0.35
  const starveRatio = opts.starveRatio ?? 0.5
  const rng = opts.rng ?? Math.random
  const loci = opts.loci ?? DEFAULT_LOCI

  const visits = loci.map(id => state.loci?.[id]?.visits ?? 0)
  const mean = visits.reduce((a, b) => a + b, 0) / Math.max(1, visits.length)
  const starved = loci.filter((_id, i) => visits[i] < mean * starveRatio)

  if (starved.length > 0 && mean >= 1) {
    return { arm: 'explore', reason: 'anti_starvation', locusHint: starved[0] }
  }

  if (rng() < exploreRate) {
    return { arm: 'explore', reason: 'explore_rate', locusHint: null }
  }
  return { arm: 'exploit', reason: 'exploit_default', locusHint: null }
}
