/**
 * Post-evaluate attribution → ledger update + event append.
 */

import {
  applyAttribution,
  appendEvent,
  classifyOutcome,
  loadLedger,
  saveLedger,
} from './ledger.js'
import { defaultClaimText } from './prompt.js'

/**
 * @param {object} evolve
 * @param {object} step
 * @param {string} step.parent_id
 * @param {string} step.child_id
 * @param {number} step.fitness
 * @param {number} [step.parent_fitness]
 * @param {string} step.locus
 * @param {'exploit'|'explore'} step.arm
 * @param {string} [step.claim_text]
 * @returns {Promise<object>} updated ledger snapshot fields for population row
 */
export async function attributeAndCommit(evolve, step) {
  const runRoot = evolve.runRoot ?? evolve.files?.root
  if (!runRoot) throw new Error('attributeAndCommit: missing evolve.runRoot')

  const outcome = classifyOutcome(step.fitness, step.parent_fitness)
  const claim_text = step.claim_text ?? defaultClaimText(step.locus, step.arm)

  const state = await loadLedger(runRoot)
  applyAttribution(state, {
    ...step,
    outcome,
    claim_text,
  })
  await saveLedger(runRoot, state)

  const event = {
    t: new Date().toISOString(),
    step: state.step,
    parent_id: step.parent_id,
    child_id: step.child_id,
    fitness: step.fitness,
    parent_fitness: step.parent_fitness,
    locus: step.locus,
    arm: step.arm,
    outcome,
    claim_text,
    tip_hash: state.tips?.incumbent?.tip_hash ?? null,
  }
  await appendEvent(runRoot, event)

  return {
    outcome,
    claim_text,
    tip_hash: state.tips?.incumbent?.tip_hash ?? null,
    locus: step.locus,
    arm: step.arm,
  }
}
