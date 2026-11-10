/**
 * VENDORED baseline loop — Organon `dsh-evolve-loop/src/providers/loop.js` contract.
 * Written into Reason for A/B and standalone runs (no Organon import).
 */

import { alive, merit } from '../population.js'

export const name = 'evolve-loop'

/**
 * @param {object} args
 * @param {object} evolve
 * @returns {Promise<{ best_id: string, best_fitness: number, remaining: number }>}
 */
export async function run(args, evolve) {
  const { maxPopulation, candidates } = await evolve.context()
  const population = evolve.population()
  const runState = evolve.currentRun()

  let rows = await population.rows()
  if (rows.length === 0) {
    const base = await evolve.copyTask()
    const baseFitness = await evolve.evaluate(base)
    await population.append({
      id: base.id,
      parent: null,
      fitness: baseFitness,
      survival: 'yes',
    })
    rows = await population.rows()
  }

  const limit = candidates ?? Infinity
  let created = 0

  while ((await evolve.context()).budget.remaining > 0 && created < limit) {
    runState.signal.throwIfAborted()

    const parentId = await evolve.select(population)
    const candidate = await evolve.mutate({ parent: parentId })
    created += 1

    const fitness = await evolve.evaluate(candidate)

    await population.append({
      id: candidate.id,
      parent: parentId,
      fitness,
      survival: 'yes',
    })

    rows = await population.rows()
    if (alive(rows).length >= maxPopulation) {
      await evolve.survive(population)
      rows = await population.rows()
    }
  }

  rows = await population.rows()
  let best = rows[0]
  for (const row of rows) {
    if (best === undefined || merit(row.fitness) > merit(best.fitness)) {
      best = row
    }
  }

  const budget = (await evolve.context()).budget
  return {
    best_id: best?.id ?? 'c000000',
    best_fitness: best?.fitness ?? 0,
    remaining: budget.remaining,
  }
}

export default { name, run }
