#!/usr/bin/env node
/**
 * Clone-and-run entrypoint (no DSH required).
 *
 *   node bin/reason-run.js
 *   node bin/reason-run.js --mode baseline --budget 5
 *   node bin/reason-run.js --task ./tasks/demo --run ./run --clean
 */

import { mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStandaloneEvolve } from '../src/standalone/harness.js'
import { run as reasonLoop } from '../src/providers/claim-loop.js'
import { run as baselineLoop } from '../src/baseline/loop.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function parseArgs(argv) {
  const out = {
    mode: 'reason',
    budget: 6,
    task: join(root, 'tasks', 'demo'),
    run: join(root, 'run'),
    clean: false,
  }
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--mode') out.mode = argv[++i]
    else if (a === '--budget') out.budget = Number(argv[++i])
    else if (a === '--task') out.task = resolve(argv[++i])
    else if (a === '--run') out.run = resolve(argv[++i])
    else if (a === '--clean') out.clean = true
    else if (a === '--help' || a === '-h') out.help = true
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    console.log(`Reason standalone runner

Usage:
  npm start
  node bin/reason-run.js [--mode reason|baseline] [--budget N] [--task DIR] [--run DIR] [--clean]

Defaults:
  --mode reason
  --task tasks/demo
  --run  ./run
`)
    return
  }

  if (args.clean) {
    await rm(args.run, { recursive: true, force: true })
  }
  await mkdir(args.run, { recursive: true })

  const mode = args.mode === 'baseline' ? 'baseline' : 'reason'
  const { evolve, init } = createStandaloneEvolve({
    taskDir: args.task,
    runRoot: args.run,
    maxBudget: args.budget,
    mode,
  })
  await init()

  const loop = mode === 'baseline' ? baselineLoop : reasonLoop
  console.log(`[reason-run] mode=${mode} budget=${args.budget}`)
  console.log(`[reason-run] task=${args.task}`)
  console.log(`[reason-run] run=${args.run}`)

  const result = await loop({}, evolve)
  console.log('[reason-run] result', result)
  if (mode === 'reason') {
    console.log(`[reason-run] claim ledger under ${join(args.run, 'claim')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
