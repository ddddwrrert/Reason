/**
 * Install Reason providers onto an existing evolve service (DSH companion mode).
 */

import claimLoop from './providers/claim-loop.js'
import claimSelect from './providers/claim-select.js'
import claimMutate from './providers/claim-mutate.js'

export const ENV_FLAG = 'DSH_EVOLVE_REASON'

/**
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {boolean}
 */
export function requested(env = process.env) {
  const value = `${env[ENV_FLAG] ?? ''}`.trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'on'
}

/**
 * Registers reason-loop + reason-select + reason-mutate.
 * Leaves evaluate / survive upstream (sealed V, baseline cull).
 * @param {object} evolve
 */
export function installReasonProviders(evolve) {
  const providers = {
    loop: claimLoop,
    select: claimSelect,
    mutate: claimMutate,
  }

  const disposers = []
  const installed = []
  for (const [slot, provider] of Object.entries(providers)) {
    disposers.push(evolve.register(slot, provider))
    installed.push(`${slot}=${provider.name}`)
  }

  evolve.reason = {
    flag: ENV_FLAG,
    installed: [...installed],
  }

  return {
    installed,
    dispose: () => {
      delete evolve.reason
      for (const dispose of disposers.reverse()) dispose()
    },
  }
}
