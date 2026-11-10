/**
 * VENDORED — copy of Organon `plugins/dsh-evolve-loop/src/population.js`.
 * Written into Reason so clone-and-run does not import Organon sources.
 *
 * @module dsh-evolve-reason/population
 */

import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const POPULATION_FILE = 'population.jsonl'

/**
 * @param {string} runDir
 * @returns {Promise<object[]>}
 */
export async function readPopulation(runDir) {
  let raw
  try {
    raw = await readFile(join(runDir, POPULATION_FILE), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  return raw.split('\n').filter(line => line.trim() !== '').map((line, index) => {
    try {
      return JSON.parse(line)
    } catch {
      throw new Error(`dsh-evolve-reason: ${POPULATION_FILE} line ${String(index + 1)} is not valid JSON`)
    }
  })
}

/**
 * @param {string} runDir
 * @param {object} record
 */
export async function appendPopulation(runDir, record) {
  await mkdir(runDir, { recursive: true })
  await appendFile(join(runDir, POPULATION_FILE), `${JSON.stringify(record)}\n`, 'utf8')
}

/**
 * @param {string} runDir
 * @param {object[]} records
 */
export async function writePopulation(runDir, records) {
  await mkdir(runDir, { recursive: true })
  const content = records.map(record => `${JSON.stringify(record)}\n`).join('')
  const tmpPath = join(
    runDir,
    `${POPULATION_FILE}.${String(Date.now())}.${String(Math.random().toString(36).slice(2))}.tmp`,
  )
  await writeFile(tmpPath, content, 'utf8')
  await rename(tmpPath, join(runDir, POPULATION_FILE))
}

/**
 * @param {object[]} records
 * @returns {object[]}
 */
export function alive(records) {
  return records.filter(record => record.survival === 'yes')
}

/**
 * @param {number} fitness
 * @returns {number}
 */
export function merit(fitness) {
  return fitness > 0 ? fitness : fitness < 0 ? -1 / fitness : 0
}

/**
 * @param {string} runDir
 */
export function populationOf(runDir) {
  return Object.freeze({
    runDir,
    rows: () => readPopulation(runDir),
    append: row => appendPopulation(runDir, row),
    write: rows => writePopulation(runDir, rows),
  })
}
