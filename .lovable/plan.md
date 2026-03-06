

## Issues Found

### 1. Consultation page not loading - React Hooks violation
In `src/pages/Consultation.tsx`, there are two `useMemo` hooks (lines 75-90) placed **after** an early return (line 66-68). When `appointment` or `patient` is null, the component returns early with fewer hooks than when data is loaded. This causes the "Rendered more hooks than during the previous render" error.

**Fix**: Move the `useMemo` hooks (`ig` and `dpp`) above the early return statement, guarding their internal logic against missing data.

### 2. Update plan prices in Settings
In `src/pages/Settings.tsx` (lines 278-288):
- **Pro**: Change from R$ 99/mes to **R$ 549/mes**, update description to mention "Secretária IA"
- **Clinica**: Change from R$ 249/mes to **R$ 1.199/mes**, update description to mention "até 3 médicas"

---

### Technical Details

**Consultation.tsx changes:**
- Move `const ig = useMemo(...)` and `const dpp = useMemo(...)` to before line 66 (the early return)
- Move `const specialty = ...` before the early return as well, or compute it inside useMemo safely

**Settings.tsx changes:**
- Line 280: `R$ 99` -> `R$ 549`
- Line 281: Update description to include "Secretária IA"
- Line 285: `R$ 249` -> `R$ 1.199`
- Line 286: Update description to "Até 3 médicas + Relatórios avançados"

