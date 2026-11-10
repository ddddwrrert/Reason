/**
 * VENDORED baseline survive — keep top-k alive by merit.
 */

import { alive, merit } from '../population.js'

export const name = 'baseline-survive'

/**
 * @param {object} population
 * @param {object} evolve
 */
export async function survive(population, evolve) {
  const { k = 5 } = await evolve.context()
  const rows = await population.rows()
  const living = alive(rows)
  if (living.length <= k) return

  const ranked = [...living].sort((a, b) => merit(b.fitness) - merit(a.fitness))
  const keep = new Set(ranked.slice(0, k).map(r => r.id))

  if (typeof population.markDead === 'function') {
    for (const row of living) {
      if (!keep.has(row.id)) await population.markDead(row.id)
    }
    return
  }

  for (const row of rows) {
    if (row.survival !== 'no' && !keep.has(row.id)) row.survival = 'no'
  }
  if (typeof population.persist === 'function') await population.persist()
}

export default { name, survive }
