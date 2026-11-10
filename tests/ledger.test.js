import { describe, expect, it } from 'vitest'
import {
  applyAttribution,
  classifyOutcome,
  emptyState,
  pickStarvedLocus,
  pickExploitLocus,
} from '../src/claim/ledger.js'

describe('classifyOutcome', () => {
  it('separates up / down / uncertain', () => {
    expect(classifyOutcome(3, 2)).toBe('up')
    expect(classifyOutcome(1, 2)).toBe('down')
    expect(classifyOutcome(2, 2)).toBe('uncertain')
  })
})

describe('applyAttribution', () => {
  it('writes R+ on up and R- on down; uncertain writes neither', () => {
    const state = emptyState()
    applyAttribution(state, {
      locus: 'repair',
      arm: 'exploit',
      outcome: 'up',
      claim_text: 'exploit:repair',
      child_id: 'c000001',
      parent_id: 'c000000',
      fitness: 2,
      parent_fitness: 1,
    })
    expect(Object.keys(state.r_plus).length).toBe(1)
    expect(Object.keys(state.r_minus).length).toBe(0)
    expect(state.tips.incumbent.fitness).toBe(2)

    applyAttribution(state, {
      locus: 'repair',
      arm: 'exploit',
      outcome: 'uncertain',
      claim_text: 'exploit:repair',
      child_id: 'c000002',
      parent_id: 'c000001',
      fitness: 2,
      parent_fitness: 2,
    })
    expect(Object.keys(state.r_minus).length).toBe(0)

    applyAttribution(state, {
      locus: 'depth',
      arm: 'explore',
      outcome: 'down',
      claim_text: 'explore:depth',
      child_id: 'c000003',
      parent_id: 'c000001',
      fitness: 1,
      parent_fitness: 2,
    })
    expect(Object.keys(state.r_minus).length).toBe(1)
  })
})

describe('locus pickers', () => {
  it('starves under-visited loci and exploits high up-rate', () => {
    const state = emptyState()
    state.loci.repair = { visits: 5, ups: 4, downs: 1, uncertain: 0, last_arm: 'exploit' }
    state.loci.structure = { visits: 5, ups: 0, downs: 5, uncertain: 0, last_arm: 'exploit' }
    state.loci.depth = { visits: 0, ups: 0, downs: 0, uncertain: 0, last_arm: null }
    state.loci.speed = { visits: 1, ups: 0, downs: 1, uncertain: 0, last_arm: 'explore' }
    expect(pickStarvedLocus(state)).toBe('depth')
    expect(pickExploitLocus(state)).toBe('repair')
  })
})
