import { DAYS } from '../theme.js';

const DAY_SPACES = new Set(['Common Washroom','Lobby / Circulation Space','Corridor / Common Space (Carpet)','Corridor / Common Space (Hard Floor)','Entrances / Vestibules','Fitness / Gym','Dining Areas']);
const EVE_SPACES = new Set(['Study Rooms / Lounges / Library / Theatre','Common Kitchen','Employee Lounge','Office / Admin Space','Stairwell','Elevator']);
const WKD_DAY   = new Set(['Common Washroom','Lobby / Circulation Space','Corridor / Common Space (Carpet)','Corridor / Common Space (Hard Floor)','Dining Areas']);
const WKD_EVE   = new Set(['Study Rooms / Lounges / Library / Theatre','Common Kitchen','Employee Lounge']);

const DAY_TASK = {
  'Common Washroom':                          'Clean/disinfect fixtures, mop, restock',
  'Lobby / Circulation Space':                'Sweep/vacuum, disinfect, walk-off mats',
  'Corridor / Common Space (Carpet)':         'Spot vacuum, disinfect touch points',
  'Corridor / Common Space (Hard Floor)':     'Sweep, disinfect touch points',
  'Entrances / Vestibules':                   'Sweep inside/outside, walk-off mats',
  'Fitness / Gym':                            'Disinfect equipment, sweep, reset',
  'Dining Areas':                             'Tables, mop, appliances, empty trash',
};
const EVE_TASK = {
  'Study Rooms / Lounges / Library / Theatre':'Vacuum, wipe tables, empty trash',
  'Common Kitchen':                            'Counters, appliances, mop, empty trash',
  'Employee Lounge':                           'Surfaces, appliances, sweep/mop',
  'Office / Admin Space':                      'Vacuum/sweep, disinfect touch points',
  'Stairwell':                                 'Sweep, spot clean, disinfect',
  'Elevator':                                  'Mop, spot clean, disinfect',
};

const OFF_MAP = { Sat:'Saturday',Sun:'Sunday',Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday' };

function offSet(daysOff) {
  const parts = (daysOff || '').split('-');
  return new Set(parts.map(p => OFF_MAP[p.trim()]).filter(Boolean));
}

export function buildSchedule(custs, rooms) {
  const byBuilding = {};
  for (const r of rooms) {
    if (!r.requiresCleaning) continue;
    if (!byBuilding[r.building]) byBuilding[r.building] = [];
    byBuilding[r.building].push(r);
  }

  return custs.map(cust => {
    const off   = offSet(cust.daysOff);
    const isDay = cust.shift.includes('Day');
    const rl    = byBuilding[cust.building] || [];

    // Group rooms by space type
    const byType = {};
    for (const r of rl) {
      if (!byType[r.spaceType]) byType[r.spaceType] = [];
      byType[r.spaceType].push(r);
    }

    const days = {};
    for (const day of DAYS) {
      if (off.has(day)) { days[day] = { off: true }; continue; }
      const wknd    = day === 'Saturday' || day === 'Sunday';
      const allowed = wknd ? (isDay ? WKD_DAY : WKD_EVE) : (isDay ? DAY_SPACES : EVE_SPACES);
      const taskMap = isDay ? DAY_TASK : EVE_TASK;
      const tasks   = [];
      let   sqft    = 0;
      for (const [st, rl2] of Object.entries(byType)) {
        if (!allowed.has(st) || !taskMap[st]) continue;
        const ts = rl2.reduce((a, r) => a + (r.sqft || 0), 0);
        tasks.push({
          spaceType: st,
          count:     rl2.length,
          sqft:      ts,
          desc:      taskMap[st],
          rooms:     rl2.slice(0, 3).map(r => r.roomNumber).join(', ') + (rl2.length > 3 ? ` +${rl2.length - 3}` : ''),
        });
        sqft += ts;
      }
      days[day] = { off: false, tasks, sqft, wknd };
    }

    return {
      ...cust,
      days,
      weeklySqft: Object.values(days).reduce((a, d) => a + (d.sqft || 0), 0),
    };
  });
}
