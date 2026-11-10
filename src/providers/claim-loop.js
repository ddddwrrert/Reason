/**
 * Reason loop — full Claim evolutionary arm.
 *
 * DIFF from baseline evolve-loop:
 *   1) chooseArm (Exploit/Explore + anti-starve)
 *   2) pick locus; stash on evolve._reasonDecision
 *   3) select → mutate(with claim) → evaluate (sealed) → append
 *   4) attributeAndCommit → R+/R-/locus/tip ledger under run/claim/
 *   5) survive
 *
 * evaluate stays sealed. Hard budget from evolve.context().budget.
 */

import { alive, merit } from '../population.js'
import { chooseArm } from '../claim/arm.js'
import { attributeAndCommit } from '../claim/attribute.js'
import {
  loadLedger,
  pickExploitLocus,
  pickStarvedLocus,
} from '../claim/ledger.js'
import { defaultClaimText } from '../claim/prompt.js'

export const name = 'reason-loop'

/**
 * @param {object} args
 * @param {object} evolve
 * @returns {Promise<{ best_id: string, best_fitness: number, remaining: number, claim?: object }>}
 */
export async function run(args, evolve) {
  const { maxPopulation, candidates } = await evolve.context()
  const population = evolve.population()
  const runState = evolve.currentRun()
  const runRoot = evolve.runRoot ?? evolve.files?.root

  let rows = await population.rows()
  if (rows.length === 0) {
    const base = await evolve.copyTask()
    const baseFitness = await evolve.evaluate(base)
    await population.append({
      id: base.id,
      parent: null,
      fitness: baseFitness,
      survival: 'yes',
      claim: { locus: 'repair', arm: 'exploit', outcome: 'uncertain' },
    })
    rows = await population.rows()
  }

  const limit = candidates ?? Infinity
  let created = 0
  let lastTip = null

  while ((await evolve.context()).budget.remaining > 0 && created < limit) {
    runState.signal.throwIfAborted()

    const state = runRoot ? await loadLedger(runRoot) : null
    const armPick = state
      ? chooseArm(state, {
        exploreRate: args?.exploreRate,
        starveRatio: args?.starveRatio,
        rng: args?.rng,
      })
      : { arm: 'exploit', reason: 'no_ledger', locusHint: null }

    const locus = armPick.locusHint
      ?? (state
        ? (armPick.arm === 'explore' ? pickStarvedLocus(state) : pickExploitLocus(state))
        : 'repair')

    evolve._reasonDecision = {
      arm: armPick.arm,
      reason: armPick.reason,
      locus,
      claim_text: defaultClaimText(locus, armPick.arm),
    }

    const parentId = await evolve.select(population)
    rows = await population.rows()
    const parentRow = rows.find(r => r.id === parentId)
    const parentFitness = typeof parentRow?.fitness === 'number' ? parentRow.fitness : undefined

    const candidate = await evolve.mutate({
      parent: parentId,
      parentFitness,
      claim: evolve._reasonDecision,
    })
    created += 1

    const fitness = await evolve.evaluate(candidate)

    let claimMeta = {
      arm: evolve._reasonDecision.arm,
      locus,
      claim_text: evolve._reasonDecision.claim_text,
      outcome: 'uncertain',
      tip_hash: null,
    }

    try {
      claimMeta = {
        ...claimMeta,
        ...(await attributeAndCommit(evolve, {
          parent_id: parentId,
          child_id: candidate.id,
          fitness,
          parent_fitness: parentFitness,
          locus,
          arm: evolve._reasonDecision.arm,
          claim_text: evolve._reasonDecision.claim_text,
        })),
      }
      lastTip = claimMeta.tip_hash
    } catch {
      // ledger failure must not break sealed search
    }

    await population.append({
      id: candidate.id,
      parent: parentId,
      fitness,
      survival: 'yes',
      claim: claimMeta,
    })

    rows = await population.rows()
    if (alive(rows).length >= maxPopulation) {
      await evolve.survive(population)
      rows = await population.rows()
    }

    delete evolve._reasonDecision
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
    claim: {
      tip_hash: lastTip ?? best?.claim?.tip_hash ?? null,
      events_dir: runRoot ? `${runRoot}/claim` : null,
    },
  }
}

export default { name, run }
