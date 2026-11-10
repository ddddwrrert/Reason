/**
 * Claim ledger: R+ (reinforce), R- (protect), loci stats, tip holdouts.
 * All IO under run/claim/ — never touches sealed evaluate.
 */

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { claimPaths, DEFAULT_LOCI } from './paths.js'
import { tipHash } from './hash.js'

/**
 * @returns {object}
 */
export function emptyState() {
  const loci = {}
  for (const id of DEFAULT_LOCI) {
    loci[id] = { visits: 0, ups: 0, downs: 0, uncertain: 0, last_arm: null }
  }
  return {
    r_plus: {},
    r_minus: {},
    loci,
    tips: {
      incumbent: null,
      holdouts: [],
    },
    step: 0,
  }
}

/**
 * @param {string} runRoot
 * @returns {Promise<object>}
 */
export async function loadLedger(runRoot) {
  const paths = claimPaths(runRoot)
  await mkdir(paths.root, { recursive: true })
  const state = emptyState()

  state.r_plus = await readJson(paths.rPlus, {})
  state.r_minus = await readJson(paths.rMinus, {})
  state.loci = { ...state.loci, ...(await readJson(paths.loci, {})) }
  state.tips = { ...state.tips, ...(await readJson(paths.tips, {})) }

  for (const id of DEFAULT_LOCI) {
    if (!state.loci[id]) {
      state.loci[id] = { visits: 0, ups: 0, downs: 0, uncertain: 0, last_arm: null }
    }
  }

  return state
}

/**
 * @param {string} runRoot
 * @param {object} state
 */
export async function saveLedger(runRoot, state) {
  const paths = claimPaths(runRoot)
  await mkdir(paths.root, { recursive: true })
  await writeFile(paths.rPlus, `${JSON.stringify(state.r_plus, null, 2)}\n`, 'utf8')
  await writeFile(paths.rMinus, `${JSON.stringify(state.r_minus, null, 2)}\n`, 'utf8')
  await writeFile(paths.loci, `${JSON.stringify(state.loci, null, 2)}\n`, 'utf8')
  await writeFile(paths.tips, `${JSON.stringify(state.tips, null, 2)}\n`, 'utf8')
}

/**
 * @param {string} runRoot
 * @param {object} event
 */
export async function appendEvent(runRoot, event) {
  const paths = claimPaths(runRoot)
  await mkdir(paths.root, { recursive: true })
  await appendFile(paths.events, `${JSON.stringify(event)}\n`, 'utf8')
}

/**
 * @param {string} path
 * @param {any} fallback
 */
async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Classify child vs parent fitness.
 * @param {number} fitness
 * @param {number|undefined} parentFitness
 * @param {number} [eps=1e-9]
 * @returns {'up'|'down'|'uncertain'}
 */
export function classifyOutcome(fitness, parentFitness, eps = 1e-9) {
  if (typeof parentFitness !== 'number' || !Number.isFinite(parentFitness)) {
    return typeof fitness === 'number' && fitness > 0 ? 'up' : 'uncertain'
  }
  if (fitness > parentFitness + eps) return 'up'
  if (fitness < parentFitness - eps) return 'down'
  return 'uncertain'
}

/**
 * Apply one attribution step into ledger state (mutates state).
 * @param {object} state
 * @param {object} step
 */
export function applyAttribution(state, step) {
  const {
    locus,
    arm,
    outcome,
    claim_text,
    child_id,
    parent_id,
    fitness,
    parent_fitness,
  } = step

  state.step = (state.step ?? 0) + 1
  const loc = state.loci[locus] ?? {
    visits: 0, ups: 0, downs: 0, uncertain: 0, last_arm: null,
  }
  loc.visits += 1
  loc.last_arm = arm
  if (outcome === 'up') loc.ups += 1
  else if (outcome === 'down') loc.downs += 1
  else loc.uncertain += 1
  state.loci[locus] = loc

  const key = `${locus}::${claim_text || 'generic'}`

  if (outcome === 'up') {
    const entry = state.r_plus[key] ?? { locus, text: claim_text || 'generic', hits: 0, last_child: null }
    entry.hits += 1
    entry.last_child = child_id
    state.r_plus[key] = entry
    // successful path clears matching ban weight slightly
    if (state.r_minus[key]) {
      state.r_minus[key].hits = Math.max(0, (state.r_minus[key].hits ?? 1) - 1)
    }
  } else if (outcome === 'down') {
    const entry = state.r_minus[key] ?? { locus, text: claim_text || 'generic', hits: 0, last_child: null }
    entry.hits += 1
    entry.last_child = child_id
    state.r_minus[key] = entry
  }
  // uncertain: do not promote to R+ or R-

  // tip holdout: new best by raw fitness (maximize)
  const tip = state.tips
  const incumbentFit = tip.incumbent?.fitness
  if (
    typeof fitness === 'number'
    && (incumbentFit === undefined || fitness > incumbentFit)
  ) {
    const hash = tipHash({ child_id, fitness, locus, parent_id })
    tip.incumbent = {
      tip_hash: hash,
      child_id,
      parent_id,
      fitness,
      parent_fitness,
      locus,
      arm,
      step: state.step,
    }
    tip.holdouts.push({
      tip_hash: hash,
      child_id,
      fitness,
      step: state.step,
      status: 'accepted_pending_holdout',
    })
  }

  return state
}

/**
 * Pick under-visited locus for Explore (anti-starvation).
 * @param {object} state
 * @param {string[]} [loci=DEFAULT_LOCI]
 * @returns {string}
 */
export function pickStarvedLocus(state, loci = DEFAULT_LOCI) {
  let best = loci[0]
  let bestScore = Infinity
  for (const id of loci) {
    const loc = state.loci[id] ?? { visits: 0, ups: 0 }
    // starve score: visits primary, then inverse ups
    const score = (loc.visits ?? 0) * 100 - (loc.ups ?? 0)
    if (score < bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}

/**
 * Pick locus for Exploit: highest up-rate with at least one visit, else first.
 * @param {object} state
 * @param {string[]} [loci=DEFAULT_LOCI]
 * @returns {string}
 */
export function pickExploitLocus(state, loci = DEFAULT_LOCI) {
  let best = loci[0]
  let bestScore = -1
  for (const id of loci) {
    const loc = state.loci[id] ?? { visits: 0, ups: 0 }
    const visits = loc.visits || 0
    const rate = visits === 0 ? 0 : (loc.ups ?? 0) / visits
    const score = rate * 10 + (loc.ups ?? 0)
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}

/**
 * Top R+ / R- lines for a locus (for mutate prompt).
 * @param {object} state
 * @param {string} locus
 * @param {number} [limit=3]
 */
export function claimsForLocus(state, locus, limit = 3) {
  const plus = Object.values(state.r_plus || {})
    .filter(e => e.locus === locus)
    .sort((a, b) => (b.hits ?? 0) - (a.hits ?? 0))
    .slice(0, limit)
  const minus = Object.values(state.r_minus || {})
    .filter(e => e.locus === locus)
    .sort((a, b) => (b.hits ?? 0) - (a.hits ?? 0))
    .slice(0, limit)
  return { plus, minus }
}
