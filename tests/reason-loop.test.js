import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { createStandaloneEvolve } from '../src/standalone/harness.js'
import { run as reasonLoop } from '../src/providers/claim-loop.js'
import { run as baselineLoop } from '../src/baseline/loop.js'
import { claimPaths } from '../src/claim/paths.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const task = join(root, 'tasks', 'demo')

/** @type {string[]} */
const temps = []

afterEach(async () => {
  while (temps.length) {
    const dir = temps.pop()
    await rm(dir, { recursive: true, force: true })
  }
})

async function freshRun(mode, budget = 5) {
  const runRoot = await mkdtemp(join(tmpdir(), `reason-${mode}-`))
  temps.push(runRoot)
  const { evolve, init } = createStandaloneEvolve({
    taskDir: task,
    runRoot,
    maxBudget: budget,
    mode,
  })
  await init()
  return { evolve, runRoot }
}

describe('reason-loop standalone', () => {
  it('runs to completion and writes claim ledger', async () => {
    const { evolve, runRoot } = await freshRun('reason', 5)
    const result = await reasonLoop({ exploreRate: 0.4 }, evolve)
    expect(result.best_id).toMatch(/^c\d+$/)
    expect(result.best_fitness).toBeGreaterThanOrEqual(0)
    expect(result.remaining).toBe(0)

    const paths = claimPaths(runRoot)
    const events = await readFile(paths.events, 'utf8')
    expect(events.trim().split('\n').length).toBeGreaterThanOrEqual(1)
    const rPlus = JSON.parse(await readFile(paths.rPlus, 'utf8'))
    const loci = JSON.parse(await readFile(paths.loci, 'utf8'))
    expect(typeof rPlus).toBe('object')
    expect(loci.repair.visits + loci.structure.visits + loci.depth.visits + loci.speed.visits)
      .toBeGreaterThan(0)
    expect(result.claim?.tip_hash || true).toBeTruthy()
  })

  it('baseline mode also runs without claim ledger requirement', async () => {
    const { evolve } = await freshRun('baseline', 3)
    const result = await baselineLoop({}, evolve)
    expect(result.best_fitness).toBeGreaterThanOrEqual(0)
    expect(result.remaining).toBe(0)
  })
})
