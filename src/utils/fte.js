import { ISSA_TASKS, FREQ_WEEKS } from '../data/cleaningMatrix.js';
import { PROD_HRS } from '../theme.js';

// Floor type constants
export const FLOOR_TYPES = ['Hard Floor', 'Carpet', 'Mixed'];
export const FLOOR_DEFAULT = 'Hard Floor';

// For a mixed room, what % is hard floor (the rest is carpet)
// Default 50/50 — overridden per room via hardSplit field (0–100)
const DEFAULT_HARD_SPLIT = 50;

export function calcFTE(rooms, factors = {}) {
  let mins = 0;

  for (const r of rooms) {
    if (!r.requiresCleaning) continue;
    const fac       = factors[r.spaceType] ?? 1;
    const floorType = r.floorType || FLOOR_DEFAULT;
    const hardSplit = (r.hardSplit ?? DEFAULT_HARD_SPLIT) / 100; // 0.0–1.0

    for (const t of (ISSA_TASKS[r.spaceType] || [])) {
      const fw = FREQ_WEEKS[t.freq] ?? 0;
      if (!fw) continue;

      const sqft100 = (r.sqft || 0) / 100;

      // ── Floor-type filtering ──────────────────────────────────────────
      // t.floorType is 'hard', 'carpet', or null (applies to all)
      let sqftMultiplier = 1;
      if (t.floorType === 'hard') {
        if (floorType === 'Carpet')  { continue; }                  // skip entirely
        if (floorType === 'Mixed')   { sqftMultiplier = hardSplit; } // partial sqft
        // Hard Floor: full sqft (multiplier stays 1)
      } else if (t.floorType === 'carpet') {
        if (floorType === 'Hard Floor') { continue; }                        // skip entirely
        if (floorType === 'Mixed')      { sqftMultiplier = 1 - hardSplit; }  // partial sqft
        // Carpet: full sqft (multiplier stays 1)
      }
      // null floorType → applies regardless of floor type, multiplier stays 1

      const units =
        t.uc === 's' ? sqft100 * sqftMultiplier :
        t.uc === 'f' ? (r.fixtures   || 1) :
        t.uc === 'b' ? (r.bins       || 1) :
        t.uc === 'd' ? (r.dispensers || 1) :
        t.uc === 'm' ? (r.mirrors    || 0) :
        t.uc === 'a' ? (r.appliances || 0) :
        t.uc === 't' ? (r.mats       || 0) : sqft100 * sqftMultiplier;

      mins += t.time * fac * units * fw;
    }
  }

  const hrs = mins / 60;
  const fte = hrs / (PROD_HRS * 5);
  return { mins, hrs, fte };
}
