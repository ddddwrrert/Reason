/**
 * Build claim blocks injected into mutate worker instructions.
 */

/**
 * @param {object} ctx
 * @param {'exploit'|'explore'} ctx.arm
 * @param {string} ctx.locus
 * @param {Array<{text:string,hits?:number}>} ctx.plus
 * @param {Array<{text:string,hits?:number}>} ctx.minus
 * @param {number} [ctx.parentFitness]
 * @returns {string}
 */
export function buildClaimBlock(ctx) {
  const { arm, locus, plus, minus, parentFitness } = ctx
  const lines = [
    '--- REASON CLAIM CONTEXT (do not evaluate; improve one candidate) ---',
    `Arm: ${arm}`,
    `Locus (focus of this attempt): ${locus}`,
  ]
  if (typeof parentFitness === 'number' && Number.isFinite(parentFitness)) {
    lines.push(`Parent official fitness: ${parentFitness}`)
  }

  lines.push('', 'R+ (reinforce — prefer these successful moves when relevant):')
  if (!plus?.length) lines.push('- (none yet)')
  else for (const e of plus) lines.push(`- [${e.hits ?? 0}×] ${e.text}`)

  lines.push('', 'R- (protect — avoid repeating these failed moves):')
  if (!minus?.length) lines.push('- (none yet)')
  else for (const e of minus) lines.push(`- [${e.hits ?? 0}×] ${e.text}`)

  lines.push(
    '',
    'Write one complete candidate. Uncertain outcomes are not bans. Do not run the official evaluator.',
    '--- END CLAIM CONTEXT ---',
  )
  return lines.join('\n')
}

/**
 * Default claim text tied to locus for attribution keys (offline + LLM).
 * @param {string} locus
 * @param {'exploit'|'explore'} arm
 */
export function defaultClaimText(locus, arm) {
  return `${arm}:${locus}`
}
