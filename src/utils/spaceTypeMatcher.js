import { SPACE_TYPES } from '../data/cleaningMatrix.js';

const RULES = [
  [['washroom','bathroom','toilet','restroom','lavatory'],                                              'Common Washroom'],
  [['kitchenette','kitchen','break room','breakroom','lunchroom'],                                     'Common Kitchens'],
  [['employee lounge','staff lounge','faculty lounge','lounge'],                                       'Lounge'],
  [['study room','library','theatre','theater','common room','meeting','seminar','classroom','lecture','multipurpose'], 'Study Rooms / Multipurpose Space, etc.'],
  [['lobby','atrium','reception','circulation','foyer','waiting','main hall'],                         'Lobby / Circulation Space'],
  [['carpet corridor','carpeted hall','corridor carpet'],                                               'Corridor / Common Space with Carpet'],
  [['garbage','trash room','waste room','refuse','compactor','bin room'],                              'Corridor / Common Space with Hard Flooring (inc. Garbage Rms)'],
  [['corridor','hallway','passage','walkway'],                                                          'Corridor / Common Space with Hard Flooring (inc. Garbage Rms)'],
  [['entrance','vestibule','entryway','front door'],                                                    'Entrances / Vestibules'],
  [['fitness','gym','exercise','weight room','recreation'],                                             'Gym / Fitness'],
  [['parking','garage','parkade'],                                                                      'Parking Garage'],
  [['dining','cafeteria','cafe','food court','canteen'],                                               'Dining Hall / Main Kitchen'],
  [['storage','store room','storeroom','supply room','utility room','janitor','laundry','mechanical'], 'Utility Rooms (Laundry Room / Storage Space / Janitor Closet, etc.)'],
  [['elevator','lift'],                                                                                 'Elevator'],
  [['stairwell','staircase','stairway'],                                                                'Stairwell'],
  [['office','admin','administration','faculty office','staff room','boardroom'],                      'Office Space / Admin Space'],
];

export function matchSpaceType(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Exact match against valid space types (case-insensitive) — short-circuits keyword rules and AI
  const exact = SPACE_TYPES.find(st => st.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const s = trimmed.toLowerCase();
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
  // Pass 2: starts-with (patterns ≥3 chars)
  for (const p of patterns) {
    if (p.length < 3) continue;
    const i = normd.findIndex(k => k.startsWith(p));
    if (i !== -1) return row[keys[i]];
  }
  // Pass 3: contains (patterns ≥4 chars)
  for (const p of patterns) {
    if (p.length < 4) continue;
    const i = normd.findIndex(k => k.includes(p));
    if (i !== -1) return row[keys[i]];
  }
  return undefined;
}

export function parseExcelRow(row) {
  const n  = (v, d = 0) => { const x = parseFloat(v); return isNaN(x) ? d : x; };
  // nf: use fieldDefault only when the column is absent entirely; blank cell → 0
  const nf = (v, d = 0) => v === undefined ? d : (parseFloat(v) || 0);
  const s  = (v, d = '') => String(v || d).trim();

  // Parse floor type from spreadsheet
  function parseFloorType(raw) {
    if (!raw) return 'Hard Floor';
    const r = raw.toString().toLowerCase();
    if (r.includes('carpet') || r.includes('cpt')) return 'Carpet';
    if (r.includes('mixed') || r.includes('both') || r.includes('combo')) return 'Mixed';
    return 'Hard Floor'; // default
  }

  const rawFloor = findCol(row, ['floortype','flooring','floor_type','floorcover','flooringtype','surfacetype','surface']);

  return {
    building:    s(findCol(row, ['buildingname','building','bldgname','bldg'])),
    roomNumber:  s(findCol(row, ['roomnumber','roomnum','roomno','roomid','room'])),
    floor:       s(findCol(row, ['floornumber','floor','flr','level','storey','story']), '1'),
    rawType:     s(findCol(row, ['spacetype','roomtype','spacecat','category','roomuse','description','roomname','spacename'])),
    floorType:   parseFloorType(rawFloor),
    hardSplit:   n(findCol(row, ['hardsplit','hardfloorpct','hardpct','hardpercent']), 50),
    sqft:        n(findCol(row, ['squarefeet','squarefootage','sqft','sqf','grosssqft','netsqft','area','size'])),
    fixtures:    nf(findCol(row, ['fixturecount','fixtures','fixture','numfixtures','toilets','urinals','sinks']), 1),
    bins:        nf(findCol(row, ['wastebins','recyclingbins','trashbins','bincount','numbins','bins','bin']), 1),
    dispensers:  nf(findCol(row, ['soapdispensers','paperdispensers','dispensercount','dispensers','dispenser']), 1),
    mirrors:     nf(findCol(row, ['mirrorcount','mirrors','mirror'])),
    appliances:  nf(findCol(row, ['largeappliances','smallappliances','appliancecount','appliances','appliance'])),
    microwaves:  nf(findCol(row, ['microwavecount','microwaves','microwave'])),
    mats:        nf(findCol(row, ['walkoffmatting','walkoffmats','walkoffmat','matcount','mats','mat'])),
    notes:       s(findCol(row, ['notes','note','comments','comment','remarks'])),
  };
}
