/**
 * Short mock run used by npm run example:mock
 */

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStandaloneEvolve } from '../src/standalone/harness.js'
import { run as reasonLoop } from '../src/providers/claim-loop.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const task = join(root, 'tasks', 'demo')
const runRoot = await mkdtemp(join(tmpdir(), 'reason-mock-'))

try {
  const { evolve, init } = createStandaloneEvolve({
    taskDir: task,
    runRoot,
    maxBudget: 4,
    mode: 'reason',
  })
  await init()
  const result = await reasonLoop({}, evolve)
  console.log(JSON.stringify(result, null, 2))
} finally {
  await rm(runRoot, { recursive: true, force: true })
}
