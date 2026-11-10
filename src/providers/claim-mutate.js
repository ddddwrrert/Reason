/**
 * Reason mutate — baseline candidate-builder + Claim context (R+/R-/locus/arm).
 */

import { claimsForLocus, loadLedger } from '../claim/ledger.js'
import { buildClaimBlock, defaultClaimText } from '../claim/prompt.js'

export const name = 'reason-mutate'

/** @returns {string} */
export function defaultPersona() {
  return 'You are a solution worker in an evolutionary search. Design and implement one complete candidate in your assigned directory. IMPLEMENT A SINGLE SOLUTION. DO NOT ATTEMPT MULTIPLE SOLUTIONS.'
}

/**
 * @param {number} [parentFitness]
 * @param {object} [claim]
 * @returns {string}
 */
export function buildInstruction(parentFitness, claim) {
  const lines = [
    'Read the task statement and the parent solution in this directory.',
  ]

  if (typeof parentFitness === 'number' && Number.isFinite(parentFitness)) {
    lines.push(`The parent candidate's official fitness was ${parentFitness}.`)
  }

  lines.push(
    'Understand how the current solution works, consider how it could better satisfy the task, and implement your chosen improvement as one complete candidate.',
    'Edit only the solution code between the #EVOLVE_START and #EVOLVE_END markers; leave all other task files and code unchanged.',
    'This directory is one allocated candidate and one complete solution attempt. You may reason about alternatives, but do not write, run, or compare several complete implementations here. A different complete attempt requires another candidate and uses another budget unit.',
    'Do not run the task\'s official evaluator or performance benchmarks; the search loop evaluates your candidate after you finish.',
  )

  if (claim) {
    lines.push('', buildClaimBlock(claim))
  }

  return lines.join('\n')
}

/**
 * @param {object} options
 * @param {object} evolve
 */
export async function mutate(options, evolve) {
  const {
    parent,
    parentFitness: providedFitness,
    instruction: providedInstruction,
    claim: providedClaim,
    name: workerName,
    description,
    persona = defaultPersona(),
    model,
    allowShell = true,
    allowedTools,
    maxDepth,
    ...extra
  } = options ?? {}

  if (!parent) throw new Error('reason-mutate needs a parent candidate id')

  let parentFitness = providedFitness
  if (parentFitness === undefined && evolve?.population) {
    const rows = await evolve.population().rows()
    const parentRow = rows.find(r => r.id === parent)
    if (parentRow && typeof parentRow.fitness === 'number') {
      parentFitness = parentRow.fitness
    }
  }

  const decision = evolve._reasonDecision ?? {}
  const arm = providedClaim?.arm ?? decision.arm ?? 'exploit'
  const locus = providedClaim?.locus ?? decision.locus ?? 'repair'

  let plus = providedClaim?.plus
  let minus = providedClaim?.minus
  if ((!plus || !minus) && (evolve.runRoot || evolve.files?.root)) {
    const state = await loadLedger(evolve.runRoot ?? evolve.files.root)
    const pack = claimsForLocus(state, locus)
    plus = plus ?? pack.plus
    minus = minus ?? pack.minus
  }

  const claim = {
    arm,
    locus,
    plus: plus ?? [],
    minus: minus ?? [],
    parentFitness,
    claim_text: providedClaim?.claim_text ?? defaultClaimText(locus, arm),
  }

  const instruction = providedInstruction ?? buildInstruction(parentFitness, claim)
  const candidate = await evolve.allocate(parent)
  const workerLabel = workerName ?? description ?? 'reason-mutator'

  try {
    await evolve.spawnWorker(candidate.dir, instruction, {
      label: workerLabel,
      persona,
      model,
      allowShell,
      allowedTools,
      maxDepth,
      reason: { arm, locus, claim_text: claim.claim_text },
      ...extra,
    })
  } catch (error) {
    const currentRun = evolve.currentRun?.()
    if (currentRun?.signal?.aborted) throw error
  }

  candidate.claim = {
    arm,
    locus,
    claim_text: claim.claim_text,
  }
  return candidate
}

export default { name, mutate, buildInstruction, defaultPersona }
