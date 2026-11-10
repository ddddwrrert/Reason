# UPSTREAM / DIFF

## Contract shared with Organon five-slot

```text
loop | select | mutate | evaluate | survive
```

- **Hard budget \(B\)**: `evolve.context().budget.remaining`
- **Official \(V\)**: `evolve.evaluate` only (sealed in DSH; mock `score_hint` offline)
- **Population**: `population.jsonl` rows `{ id, parent, fitness, survival, ... }`

## Reason DIFF (only)

1. **Arm scheduler** before select: Exploit vs Explore + anti-starvation  
2. **Locus** chosen per step; stored on `evolve._reasonDecision`  
3. **Mutate** appends Claim block: R+ / R- / locus / arm  
4. **After evaluate**: attribute → `run/claim/` ledger (`r_plus`, `r_minus`, `loci`, `tips`, `events.jsonl`)  
5. **uncertain ≠ down**: no R- write on flat fitness  

## Not claimed

This repository proves the **control flow is runnable**. It does **not** prove AHC tip gains on a contest task.
