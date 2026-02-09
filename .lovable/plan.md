

# Redesigned Quantity Popup for Inventory Counting

## What Changes

The quantity popup will be simplified and restructured so counting is faster and more intuitive.

### Layout: Unopened and Opened on One Row
- Unopened and Opened bottle counters sit side-by-side in a single row, each with +/- buttons and a count number.
- No extra selection logic for opened bottles -- just a simple +/- counter like unopened.

### Partial Bottles Appear Dynamically
- When opened bottles > 0, a "Partial Bottles" section appears below.
- One partial entry per opened bottle (e.g., 2 opened = 2 partial rows).
- Each partial row shows glass dimension buttons (from admin settings) for quick selection. Tapping a glass dimension sets that bottle's partial amount in litres.
- Each row also has a manual litres input as fallback.
- The partial value auto-converts to bottle fraction based on the wine's volume (e.g., 0.250L / 0.750L = 0.333 btl).

### Calculation Summary
- Shows two totals side-by-side:
  - **In Litres:** e.g., "1.950L"
  - **In Bottles:** e.g., "2.25 btl" (unopened + sum of partial fractions)
- Unopened bottles counted as full (1.0 btl each). Each opened bottle counted as its partial fraction.

### Removed
- The Manual/By Glass toggle (partialMode) -- glass buttons are always visible, with a manual input alongside.
- The "fraction vs litres" unit toggle complexity -- always input in litres, always display both litres and btl.

---

## Technical Details

### File: `src/components/count/QuantityPopup.tsx` (rewrite)

**State changes:**
- `unopened: number` -- unchanged
- `openedCount: number` -- number of opened bottles (simple counter)
- `partialLitres: number[]` -- array of length `openedCount`, each entry is the litres remaining in that opened bottle (default 0)
- `notes: string` -- unchanged

**Partial bottle rows:**
- When `openedCount` changes, resize `partialLitres` array (add 0s or trim from end).
- Each row: glass dimension buttons + manual input field.
- Tapping a glass button sets that row's value (not additive -- replaces).
- Manual input allows typing any value up to the wine's volume in litres.

**Calculations:**
- `totalLitres = (unopened * wineVolumeLitres) + sum(partialLitres)`
- `totalBtl = unopened + sum(partialLitres.map(p => p / wineVolumeLitres))`
- Display: "2.25 btl / 1.688L"

**Confirm button text:** `Confirm (2.25 btl / 1.688L)`

**onConfirm callback:** passes `(unopened, totalOpenedFraction, notes)` where `totalOpenedFraction = sum(partialLitres) / wineVolumeLitres`.

### No other files change.

