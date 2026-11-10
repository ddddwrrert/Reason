# Reason

**Claim-guided evolutionary search:** \(R^+\) reinforce / \(R^-\) protect / locus / tip_hash, with **Exploit / Explore** and anti-starvation — a full five-slot arm (not a mutate tip-in).

Standalone clone-and-run (no DSH required). Optional Cordis companion via `DSH_EVOLVE_REASON=1`.

**同源清单：** [`ORIGIN.md`](ORIGIN.md) · **DIFF：** [`docs/UPSTREAM.md`](docs/UPSTREAM.md)

## Loop

```text
chooseArm (exploit|explore + anti-starve)
  → pick locus
  → select(parent)
  → mutate(parent, R+/R-/locus)
  → evaluate                    # sealed official V (mock offline)
  → append population
  → attribute → run/claim/*     # uncertain ≠ down
  → survive
```

| Slot | Provider | Role |
|------|----------|------|
| `loop` | `reason-loop` | Claim scheduler + attribution |
| `select` | `reason-select` | Locus-aware parent pick |
| `mutate` | `reason-mutate` | Inject claim context |
| `evaluate` | upstream / mock | **Never replaced** |
| `survive` | baseline top-k | Cull by merit |

## Offline smoke (no DSH / no LLM)

```bash
npm install
npm test
npm start
# or: node bin/reason-run.js --mode reason --budget 6 --clean
# A/B: node bin/reason-run.js --mode baseline --budget 6 --clean
```

Ledger lands in `run/claim/` (`events.jsonl`, `r_plus.json`, `r_minus.json`, `loci.json`, `tips.json`).

## DSH (optional)

```bash
dsh plugin --profile web add ./
export DSH_EVOLVE_REASON=1
```

Requires an `evolve` service from `dsh-evolve-loop`. Disable the flag to restore the default arm for A/B.

## Honest boundary

Runnable Claim **control flow** ≠ proven AHC tip lift. Same \(B\), official \(V\) contest runs are still required before claiming score wins.

## Layout

```text
src/
  population.js                 # VENDORED
  baseline/{loop,select,mutate,survive,evaluate}.js
  claim/{ledger,arm,prompt,gate,attribute,paths,hash}.js
  providers/{claim-loop,claim-select,claim-mutate}.js
  standalone/harness.js
bin/reason-run.js
tasks/demo/
```
