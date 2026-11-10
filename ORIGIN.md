# ORIGIN — what is vendored vs new in Reason

## Vendored (written once into this repo; no Organon import at runtime for standalone)

| File | Upstream counterpart |
|------|----------------------|
| `src/population.js` | `plugins/dsh-evolve-loop/src/population.js` |
| `src/baseline/loop.js` | `plugins/dsh-evolve-loop/src/providers/loop.js` |
| `src/baseline/select.js` | Organon-style merit select (portable default) |
| `src/baseline/mutate.js` | `plugins/dsh-evolve-loop/src/providers/mutate.js` |
| `src/baseline/survive.js` | Organon-style top-k survive |
| `src/baseline/evaluate.js` | Sealed-slot marker only (V not reimplemented) |

## New (Reason Claim arm)

| File | Role |
|------|------|
| `src/claim/*` | Ledger, arm, prompt, gate, attribute |
| `src/providers/claim-loop.js` | Exploit/Explore loop |
| `src/providers/claim-select.js` | Locus-aware select |
| `src/providers/claim-mutate.js` | R+/R- injection |
| `src/standalone/harness.js` | Offline evolve API subset |
| `bin/reason-run.js` | CLI |

## Runtime (optional DSH)

When `DSH_EVOLVE_REASON=1` inside a DSH profile that already provides `evolve`, Reason registers its loop/select/mutate and **leaves sealed evaluate upstream**.
