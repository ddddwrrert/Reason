/**
 * VENDORED baseline mutate — Organon candidate-builder contract.
 */

export const name = 'candidate-builder'

/** @returns {string} */
export function defaultPersona() {
  return 'You are a solution worker in an evolutionary search. Design and implement one complete candidate in your assigned directory. IMPLEMENT A SINGLE SOLUTION. DO NOT ATTEMPT MULTIPLE SOLUTIONS.'
}

/**
 * @param {number} [parentFitness]
 * @returns {string}
 */
export function defaultInstruction(parentFitness) {
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

  return lines.join('\n')
}

/**
 * @param {object} options
 * @param {object} evolve
 * @returns {Promise<{ id: string, dir: string }>}
 */
export async function mutate(options, evolve) {
  const {
    parent,
    parentFitness: providedFitness,
    instruction: providedInstruction,
    name: workerName,
    description,
    persona = defaultPersona(),
    model,
    allowShell = true,
    allowedTools,
    maxDepth,
    ...extra
  } = options ?? {}

  if (!parent) throw new Error('mutate needs a parent candidate id')

  let parentFitness = providedFitness
  if (parentFitness === undefined && evolve?.population) {
    const rows = await evolve.population().rows()
    const parentRow = rows.find(r => r.id === parent)
    if (parentRow && typeof parentRow.fitness === 'number') {
      parentFitness = parentRow.fitness
    }
  }

  const instruction = providedInstruction ?? defaultInstruction(parentFitness)
  const candidate = await evolve.allocate(parent)
  const workerLabel = workerName ?? description ?? 'mutator'

  try {
    await evolve.spawnWorker(candidate.dir, instruction, {
      label: workerLabel,
      persona,
      model,
      allowShell,
      allowedTools,
      maxDepth,
      ...extra,
    })
  } catch (error) {
    const currentRun = evolve.currentRun?.()
    if (currentRun?.signal?.aborted) throw error
  }

  return candidate
}

export default { name, mutate, defaultInstruction, defaultPersona }
