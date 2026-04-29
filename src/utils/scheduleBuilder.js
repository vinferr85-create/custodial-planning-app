import { DAYS } from '../theme.js';

// Space types cleaned during Day shift
const DAY_SPACES = new Set([
  'Common Washroom','Lobby / Circulation Space',
  'Corridor / Common Space (Carpet)','Corridor / Common Space (Hard Floor)',
  'Entrances / Vestibules','Fitness / Gym','Dining Areas','Garbage Room',
]);
// Space types cleaned during Afternoon shift
const AFT_SPACES = new Set([
  'Study Rooms / Lounges / Library / Theatre','Common Kitchen',
  'Employee Lounge','Office / Admin Space','Stairwell','Elevator','Storage',
]);
// Space types cleaned during Night shift
const NGT_SPACES = new Set([
  'Common Washroom','Office / Admin Space','Corridor / Common Space (Carpet)',
  'Corridor / Common Space (Hard Floor)','Stairwell','Elevator',
  'Locker Rooms','Parking Garage',
]);

// Weekend reduced sets
const WKD_DAY = new Set(['Common Washroom','Lobby / Circulation Space','Corridor / Common Space (Carpet)','Corridor / Common Space (Hard Floor)','Dining Areas','Garbage Room']);
const WKD_AFT = new Set(['Study Rooms / Lounges / Library / Theatre','Common Kitchen','Employee Lounge']);
const WKD_NGT = new Set(['Common Washroom','Corridor / Common Space (Hard Floor)','Elevator','Stairwell']);

const DAY_TASK = {
  'Common Washroom':                          'Clean/disinfect fixtures, mop, restock',
  'Lobby / Circulation Space':                'Sweep/vacuum, disinfect, walk-off mats',
  'Corridor / Common Space (Carpet)':         'Spot vacuum, disinfect touch points',
  'Corridor / Common Space (Hard Floor)':     'Sweep, disinfect touch points',
  'Entrances / Vestibules':                   'Sweep inside/outside, walk-off mats',
  'Fitness / Gym':                            'Disinfect equipment, sweep, reset',
  'Dining Areas':                             'Tables, mop, appliances, empty trash',
  'Garbage Room':                             'Empty bins, clean room, disinfect',
};
const AFT_TASK = {
  'Study Rooms / Lounges / Library / Theatre':'Vacuum, wipe tables, empty trash',
  'Common Kitchen':                            'Counters, appliances, mop, empty trash',
  'Employee Lounge':                           'Surfaces, appliances, sweep/mop',
  'Office / Admin Space':                      'Vacuum/sweep, disinfect touch points',
  'Stairwell':                                 'Sweep, spot clean, disinfect',
  'Elevator':                                  'Mop, spot clean, disinfect',
  'Storage':                                   'Sweep, spot clean, tidy',
};
const NGT_TASK = {
  'Common Washroom':                          'Deep clean fixtures, mop, restock',
  'Office / Admin Space':                     'Full vacuum/mop, empty trash, disinfect',
  'Corridor / Common Space (Carpet)':         'Full vacuum, spot treat',
  'Corridor / Common Space (Hard Floor)':     'Full mop, disinfect',
  'Stairwell':                                'Sweep, mop, handrails',
  'Elevator':                                 'Full clean, disinfect',
  'Locker Rooms':                             'Full clean, disinfect, mop',
  'Parking Garage':                           'Sweep, spot clean',
};

const OFF_MAP = { Sat:'Saturday',Sun:'Sunday',Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday' };

function offSet(daysOff) {
  const parts = (daysOff || '').split('-');
  return new Set(parts.map(p => OFF_MAP[p.trim()]).filter(Boolean));
}

function getShiftType(shift) {
  if (!shift) return 'day';
  const s = shift.toLowerCase();
  if (s.includes('night'))     return 'night';
  if (s.includes('afternoon')) return 'afternoon';
  return 'day';
}

export function buildSchedule(custs, rooms) {
  const byBuilding = {};
  for (const r of rooms) {
    if (!r.requiresCleaning) continue;
    if (!byBuilding[r.building]) byBuilding[r.building] = [];
    byBuilding[r.building].push(r);
  }

  return custs.map(cust => {
    const off       = offSet(cust.daysOff);
    const shiftType = getShiftType(cust.shift);
    const rl        = byBuilding[cust.building] || [];

    const byType = {};
    for (const r of rl) {
      if (!byType[r.spaceType]) byType[r.spaceType] = [];
      byType[r.spaceType].push(r);
    }

    const days = {};
    for (const day of DAYS) {
      if (off.has(day)) { days[day] = { off: true }; continue; }
      const wknd = day === 'Saturday' || day === 'Sunday';

      let allowed, taskMap;
      if (shiftType === 'night') {
        allowed = wknd ? WKD_NGT : NGT_SPACES;
        taskMap = NGT_TASK;
      } else if (shiftType === 'afternoon') {
        allowed = wknd ? WKD_AFT : AFT_SPACES;
        taskMap = AFT_TASK;
      } else {
        allowed = wknd ? WKD_DAY : DAY_SPACES;
        taskMap = DAY_TASK;
      }

      const tasks = []; let sqft = 0;
      for (const [st, rl2] of Object.entries(byType)) {
        if (!allowed.has(st) || !taskMap[st]) continue;
        const ts = rl2.reduce((a, r) => a + (r.sqft || 0), 0);
        tasks.push({
          spaceType: st, count: rl2.length, sqft: ts, desc: taskMap[st],
          rooms: rl2.slice(0, 3).map(r => r.roomNumber).join(', ') + (rl2.length > 3 ? ` +${rl2.length - 3}` : ''),
        });
        sqft += ts;
      }
      days[day] = { off: false, tasks, sqft, wknd, shiftType };
    }

    return { ...cust, days, shiftType, weeklySqft: Object.values(days).reduce((a, d) => a + (d.sqft || 0), 0) };
  });
}
