import { ISSA_TASKS, FREQ_WEEKS } from '../data/cleaningMatrix.js';
import { PROD_HRS } from '../theme.js';

export function calcFTE(rooms, factors = {}) {
  let mins = 0;
  for (const r of rooms) {
    if (!r.requiresCleaning) continue;
    const fac = factors[r.spaceType] ?? 1;
    for (const t of (ISSA_TASKS[r.spaceType] || [])) {
      const fw = FREQ_WEEKS[t.freq] ?? 0;
      if (!fw) continue;
      const sqft100 = (r.sqft || 0) / 100;
      const units =
        t.uc === 's' ? sqft100 :
        t.uc === 'f' ? (r.fixtures   || 1) :
        t.uc === 'b' ? (r.bins       || 1) :
        t.uc === 'd' ? (r.dispensers || 1) :
        t.uc === 'm' ? (r.mirrors    || 0) :
        t.uc === 'a' ? (r.appliances || 0) :
        t.uc === 't' ? (r.mats       || 0) : sqft100;
      mins += t.time * fac * units * fw;
    }
  }
  const hrs = mins / 60;
  const fte = hrs / (PROD_HRS * 5);
  return { mins, hrs, fte };
}
