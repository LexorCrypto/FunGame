# Codex audit record — 48783c9
# Verdict: ITERATE
# --- findings ---
Sub-field fallback → measured visualViewport px + vv resize listener. Model gpt-5.6-sol, effort high, read-only.
- [P2] body min-height:100vh still centered against the large layout box (mobile chrome). FIXED in 3297086 (body height from measured px).
- [P3] pinch zoom (visualViewport.scale) re-triggered integer recompute. FIXED in 3297086 (scale!==1 guard). No P1.
