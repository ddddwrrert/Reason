/**
 * VENDORED sealed-evaluate contract note.
 *
 * In DSH / Organon, evaluate is sealed (official V). Reason never replaces it.
 * Standalone harness implements a mock V that reads score_hint from solution.cpp.
 * This module only documents the slot and exposes a name for registry tables.
 */

export const name = 'sealed-evaluate'
export const SEALED = true

export default { name, SEALED }
