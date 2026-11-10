/**
 * VENDORED baseline select — pick best alive by merit.
 */

import { alive, merit } from '../population.js'

export const name = 'baseline-select'

/**
 * @param {object} population
 * @param {object} [_evolve]
 * @returns {Promise<string>}
 */
export async function select(population, _evolve) {
  const rows = alive(await population.rows())
  if (rows.length === 0) throw new Error('select: empty population')
  let best = rows[0]
  for (const row of rows) {
    if (merit(row.fitness) > merit(best.fitness)) best = row
  }
  return best.id
}

export default { name, select }
