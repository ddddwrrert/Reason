import { describe, expect, it } from 'vitest'
import { chooseArm } from '../src/claim/arm.js'
import { emptyState } from '../src/claim/ledger.js'

describe('chooseArm', () => {
  it('forces explore under anti-starvation', () => {
    const state = emptyState()
    state.loci.repair.visits = 4
    state.loci.structure.visits = 4
    state.loci.depth.visits = 4
    state.loci.speed.visits = 0
    const pick = chooseArm(state, { rng: () => 0.99 })
    expect(pick.arm).toBe('explore')
    expect(pick.reason).toBe('anti_starvation')
  })

  it('respects explore_rate when balanced', () => {
    const state = emptyState()
    for (const id of Object.keys(state.loci)) state.loci[id].visits = 2
    expect(chooseArm(state, { exploreRate: 0.5, rng: () => 0.1 }).arm).toBe('explore')
    expect(chooseArm(state, { exploreRate: 0.5, rng: () => 0.9 }).arm).toBe('exploit')
  })
})
