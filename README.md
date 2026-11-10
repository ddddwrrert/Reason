# Reason

**Claim-guided evolutionary search:** \(R^+\) reinforce / \(R^-\) protect / locus / tip_hash, with **Exploit / Explore** and anti-starvation 鈥?a full five-slot arm (not a mutate tip-in).

Standalone clone-and-run (no DSH required). Optional Cordis companion via `DSH_EVOLVE_REASON=1`.

**鍚屾簮娓呭崟锛?* [`ORIGIN.md`](ORIGIN.md) 路 **DIFF锛?* [`docs/UPSTREAM.md`](docs/UPSTREAM.md)

## Loop

```text
chooseArm (exploit|explore + anti-starve)
  鈫?pick locus
  鈫?select(parent)
  鈫?mutate(parent, R+/R-/locus)
  鈫?evaluate                    # sealed official V (mock offline)
  鈫?append population
  鈫?attribute 鈫?run/claim/*     # uncertain 鈮?down
  鈫?survive
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

Runnable Claim **control flow** 鈮?proven AHC tip lift. Same \(B\), official \(V\) contest runs are still required before claiming score wins.

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
