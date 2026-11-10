/**
 * Tip / promotion gate helpers.
 *
 * Hard rules:
 * - Official V only (fitness from sealed evaluate)
 * - Hard budget B owned by evolve.context().budget
 * - Uncertain ≠ down (never write R- on uncertain)
 * - tip_hash records incumbent; holdout list is audit-only offline
 */

/**
 * @param {object} tips
 * @returns {object|null}
 */
export function currentIncumbent(tips) {
  return tips?.incumbent ?? null
}

/**
 * Whether a candidate fitness beats the tip incumbent.
 * @param {object|null} incumbent
 * @param {number} fitness
 */
export function beatsIncumbent(incumbent, fitness) {
  if (!incumbent || typeof incumbent.fitness !== 'number') return true
  return fitness > incumbent.fitness
}
