import { SPACE_TYPES } from '../data/cleaningMatrix.js';

const RULES = [
  [['washroom','bathroom','toilet','restroom',' wc','lavatory'],        'Common Washroom'],
  [['kitchenette','kitchen','break room','breakroom','lunchroom'],       'Common Kitchen'],
  [['employee lounge','staff lounge','faculty lounge'],                  'Employee Lounge'],
  [['lounge','study room','library','theatre','theater','common room','meeting','seminar','classroom','lecture','multipurpose'], 'Study Rooms / Lounges / Library / Theatre'],
  [['lobby','atrium','reception','circulation','foyer','waiting','main hall'], 'Lobby / Circulation Space'],
  [['corridor carpet','carpeted hall'],                                  'Corridor / Common Space (Carpet)'],
  [['corridor','hallway',' hall ','passage','walkway'],                  'Corridor / Common Space (Hard Floor)'],
  [['entrance','vestibule','entryway','front door'],                     'Entrances / Vestibules'],
  [['fitness','gym','exercise','weight room','recreation'],              'Fitness / Gym'],
  [['parking','garage','parkade'],                                       'Parking Garage'],
  [['dining','cafeteria','cafe','food court','canteen'],                 'Dining Areas'],
  [['locker','change room','dressing room'],                             'Locker Rooms'],
  [['storage','store room','storeroom','supply room','utility room'],    'Storage'],
  [['garbage','trash room','waste room','refuse','compactor','bin room'],'Garbage Room'],
  [['elevator','lift'],                                                  'Elevator'],
  [['stairwell','staircase','stairway'],                                 'Stairwell'],
  [['office','admin','administration','faculty office','staff room','conference','boardroom'], 'Office / Admin Space'],
];

export function matchSpaceType(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  for (const [keywords, spaceType] of RULES) {
    if (keywords.some(k => s.includes(k))) return spaceType;
  }
  return null;
}

export async function aiMapSpaceTypes(unknownTypes) {
  if (!unknownTypes.length) return {};
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Map each space type label to the best match from this list:\n${SPACE_TYPES.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nLabels:\n${unknownTypes.map((t, i) => `${i + 1}. "${t}"`).join('\n')}\n\nReply ONLY with valid JSON. Keys=original labels, values=exact space type strings.`
        }]
      })
    });
    const d = await res.json();
    const text = (d.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// ── Column finder for Excel uploads ─────────────────────────────────────
function normKey(k) {
  return k.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findCol(row, patterns) {
  const keys  = Object.keys(row);
  const normd = keys.map(normKey);
  // Pass 1: exact
  for (const p of patterns) {
    const i = normd.indexOf(p);
    if (i !== -1) return row[keys[i]];
  }
  // Pass 2: starts-with (patterns ≥5 chars)
  for (const p of patterns) {
    if (p.length < 5) continue;
    const i = normd.findIndex(k => k.startsWith(p));
    if (i !== -1) return row[keys[i]];
  }
  // Pass 3: contains (patterns ≥6 chars)
  for (const p of patterns) {
    if (p.length < 6) continue;
    const i = normd.findIndex(k => k.includes(p));
    if (i !== -1) return row[keys[i]];
  }
  return '';
}

export function parseExcelRow(row) {
  const n = (v, d = 0) => { const x = parseFloat(v); return isNaN(x) ? d : x; };
  const s = (v, d = '') => String(v || d).trim();
  return {
    building:    s(findCol(row, ['buildingname','building','bldgname','bldg'])),
    roomNumber:  s(findCol(row, ['roomnumber','roomnum','roomno','roomid','room'])),
    floor:       s(findCol(row, ['floornumber','floor','flr','level','storey','story']), '1'),
    rawType:     s(findCol(row, ['spacetype','roomtype','spacecat','category','roomuse','description','roomname','spacename'])),
    sqft:        n(findCol(row, ['squarefeet','squarefootage','sqft','sqf','grosssqft','netsqft','area','size'])),
    fixtures:    n(findCol(row, ['fixtures','fixture','toilets','urinals','sinks']), 1),
    bins:        n(findCol(row, ['wastebins','recyclingbins','trashbins','bins','bin']), 1),
    dispensers:  n(findCol(row, ['soapdispensers','paperdispensers','dispensers','dispenser']), 1),
    mirrors:     n(findCol(row, ['mirrors','mirror'])),
    appliances:  n(findCol(row, ['largeappliances','appliances','appliance'])),
    microwaves:  n(findCol(row, ['microwaves','microwave'])),
    mats:        n(findCol(row, ['walkoffmats','walkoffmatting','mats','mat'])),
    notes:       s(findCol(row, ['notes','note','comments','comment','remarks'])),
  };
}
