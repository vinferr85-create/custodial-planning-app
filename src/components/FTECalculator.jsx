import { useState } from 'react';
import { C, PROD_HRS } from '../theme.js';
import { Card, Badge, Btn, PageHeader } from './UI.jsx';
import { calcFTE } from '../utils/fte.js';

// Shift assignments for Ideal Staffing Plan — keyed to actual SPACE_TYPES in cleaningMatrix.js
const SHIFT_BUCKETS = {
  day: new Set([
    'Common Washroom',
    'Lobby / Circulation Space',
    'Corridor / Common Space with Carpet',
    'Corridor / Common Space with Hard Flooring (inc. Garbage Rms)',
    'Entrances / Vestibules',
    'Gym / Fitness',
    'Dining Hall / Main Kitchen',
  ]),
  afternoon: new Set([
    'Office Space / Admin Space',
    'Common Kitchens',
    'Lounge',
    'Elevator',
    'Stairwell',
    'Utility Rooms (Laundry Room / Storage Space / Janitor Closet, etc.)',
  ]),
  night: new Set([
    'Study Rooms / Multipurpose Space, etc.',
    'Parking Garage',
  ]),
};

function shiftFor(spaceType) {
  if (SHIFT_BUCKETS.day.has(spaceType))       return 'day';
  if (SHIFT_BUCKETS.afternoon.has(spaceType)) return 'afternoon';
  return 'night';
}

// Round FTE up to nearest 0.5, then up to whole number
function staffCount(fte) {
  return Math.ceil(Math.ceil(fte * 2) / 2);
}

export default function FTECalculator({ rooms, factors, setFactors, onSaveFactors }) {
  const [selectedBuilding, setSelectedBuilding] = useState('All');
  const [globalFac, setGlobalFac] = useState('');

  // Building selector options
  const buildings = ['All', ...new Set(rooms.map(r => r.building).filter(Boolean))];

  // All cleaned rooms — used for global factor operations regardless of building filter
  const allCl = rooms.filter(r => r.requiresCleaning);
  const allSpaceTypes = [...new Set(allCl.map(r => r.spaceType))];

  // Filtered rooms for KPIs, breakdown table, and Ideal Staffing
  const cl = selectedBuilding === 'All'
    ? allCl
    : allCl.filter(r => r.building === selectedBuilding);

  const { mins, hrs, fte } = calcFTE(cl, factors);

  const bySpace = {};
  for (const r of cl) {
    if (!bySpace[r.spaceType]) bySpace[r.spaceType] = [];
    bySpace[r.spaceType].push(r);
  }
  const spaceTypes = Object.keys(bySpace);
  const hasAdj = Object.entries(factors).some(([, v]) => v !== 1);

  function setFac(spaceType, val) {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) return;
    const rounded = Math.round(n * 100) / 100;
    const updated = { ...factors, [spaceType]: rounded };
    setFactors(updated);
    onSaveFactors?.(updated);
  }

  function applyToAll() {
    const n = parseFloat(globalFac);
    if (isNaN(n) || n <= 0) return;
    const rounded = Math.round(n * 100) / 100;
    const updated = Object.fromEntries(allSpaceTypes.map(st => [st, rounded]));
    setFactors(p => ({ ...p, ...updated }));
    onSaveFactors?.({ ...factors, ...updated });
    setGlobalFac('');
  }

  function resetAll() {
    const updated = Object.fromEntries(allSpaceTypes.map(st => [st, 1]));
    setFactors(p => ({ ...p, ...updated }));
    onSaveFactors?.({ ...factors, ...updated });
  }

  // Ideal Staffing Plan — FTE per shift from filtered rooms
  const shiftRooms = { day: [], afternoon: [], night: [] };
  for (const r of cl) shiftRooms[shiftFor(r.spaceType)].push(r);
  const shiftFTE = {
    day:       calcFTE(shiftRooms.day,       factors).fte,
    afternoon: calcFTE(shiftRooms.afternoon, factors).fte,
    night:     calcFTE(shiftRooms.night,     factors).fte,
  };
  const shiftStaff = {
    day:       staffCount(shiftFTE.day),
    afternoon: staffCount(shiftFTE.afternoon),
    night:     staffCount(shiftFTE.night),
  };
  const SHIFT_LABELS = [
    { key: 'day',       label: 'Day',       time: '7am–3pm',  color: C.tealLt },
    { key: 'afternoon', label: 'Afternoon', time: '3pm–11pm', color: C.gold   },
    { key: 'night',     label: 'Night',     time: '11pm–7am', color: C.g2     },
  ];

  const LBL = { fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div>
      <PageHeader title="FTE Calculator" sub="ISSA 612 task times × unit counts × frequency × adjustment factors" />

      {/* Building filter */}
      {buildings.length > 2 && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          {buildings.map(b => (
            <Btn key={b} small variant={selectedBuilding === b ? 'pri' : 'sec'} onClick={() => setSelectedBuilding(b)}>
              {b.length > 14 ? b.split(' ')[0] : b}
            </Btn>
          ))}
          {selectedBuilding !== 'All' && (
            <span style={{ marginLeft: 4, fontSize: 11, color: C.tealLt, fontWeight: 600 }}>
              Showing: {selectedBuilding}
            </span>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Weekly Minutes', v: Math.round(mins).toLocaleString(), c: C.tealLt },
          { l: 'Weekly Hours',   v: hrs.toFixed(1),                    c: C.gold   },
          { l: 'FTEs Required',  v: fte.toFixed(2),                    c: C.green  },
        ].map(k => (
          <Card key={k.l}>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.c, fontFamily: 'Georgia,serif', textAlign: 'center' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: C.g2, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* Apply to All */}
      <Card style={{ marginBottom: 14, background: '#0a2030', borderColor: C.teal + '44' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.tealLt, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Global Factor — Apply to All Space Types
        </div>
        <div style={{ fontSize: 11, color: C.g2, marginBottom: 10 }}>
          Set a single factor across every space type at once. 1.0 = ISSA standard · &gt;1.0 = your team is slower · &lt;1.0 = your team is faster.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={LBL}>Factor Value</span>
            <input
              type="number" step="0.05" min="0.1" max="5"
              value={globalFac}
              onChange={e => setGlobalFac(e.target.value)}
              placeholder="e.g. 1.15"
              style={{ width: 100, background: '#ffffff15', border: `1px solid ${C.teal}`, borderRadius: 7, padding: '7px 10px', color: C.white, fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none' }}
            />
          </label>
          <Btn variant="gold" onClick={applyToAll} disabled={!globalFac}>
            Apply to All Space Types
          </Btn>
          {hasAdj && (
            <Btn variant="danger" onClick={resetAll}>
              Reset All to 1.0
            </Btn>
          )}
          {hasAdj && (
            <div style={{ fontSize: 11, color: C.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚡ {Object.entries(factors).filter(([, v]) => v !== 1).length} space type(s) adjusted
            </div>
          )}
        </div>
      </Card>

      {/* By space type — with inline factor controls */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.tealLt, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          By Space Type — Adjust Factor Inline
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.8fr 0.8fr 0.7fr 0.6fr 1.4fr', borderBottom: '1px solid #ffffff20', marginBottom: 0 }}>
          {['Space Type', 'Rooms', 'Sq Ft', 'Wkly Hrs', 'FTE', 'Factor', 'Adjust'].map(h => (
            <div key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {!spaceTypes.length && (
          <div style={{ padding: 24, textAlign: 'center', color: C.g2, fontSize: 13 }}>Add rooms to see calculations.</div>
        )}

        {spaceTypes.map((sp, i) => {
          const rl  = bySpace[sp];
          const fac = factors[sp] ?? 1;
          const r   = calcFTE(rl, factors);
          const sq  = rl.reduce((a, x) => a + (x.sqft || 0), 0);
          const isAdj = fac !== 1;

          return (
            <div key={sp} style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.8fr 0.8fr 0.7fr 0.6fr 1.4fr', background: i % 2 === 0 ? '#ffffff05' : 'transparent', borderBottom: '1px solid #ffffff08', alignItems: 'center' }}>
              <div style={{ padding: '8px 8px', fontSize: 11, color: C.tealLt }}>{sp}</div>
              <div style={{ padding: '8px 8px', fontSize: 11, color: C.g2 }}>{rl.length}</div>
              <div style={{ padding: '8px 8px', fontSize: 11, color: C.g2 }}>{Math.round(sq).toLocaleString()}</div>
              <div style={{ padding: '8px 8px', fontSize: 11, color: isAdj ? C.gold : C.off, fontWeight: isAdj ? 700 : 400 }}>{r.hrs.toFixed(1)}</div>
              <div style={{ padding: '8px 8px' }}>
                <strong style={{ color: isAdj ? C.gold : C.green, fontSize: 12 }}>{r.fte.toFixed(2)}</strong>
              </div>
              <div style={{ padding: '8px 8px' }}>
                <Badge color={fac > 1 ? C.red : fac < 1 ? C.green : C.g2}>×{fac.toFixed(2)}</Badge>
              </div>
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <button onClick={() => setFac(sp, (fac - 0.05).toFixed(2))}
                  style={{ background: '#ffffff18', border: '1px solid #ffffff22', borderRadius: 5, color: C.off, cursor: 'pointer', width: 24, height: 24, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                <input
                  type="number" step="0.05" min="0.1" max="5"
                  value={fac}
                  onChange={e => setFac(sp, e.target.value)}
                  style={{ width: 52, background: isAdj ? C.gold + '22' : '#ffffff0d', border: `1px solid ${isAdj ? C.gold : '#ffffff22'}`, borderRadius: 6, padding: '4px 6px', color: isAdj ? C.gold : C.off, fontSize: 12, fontWeight: isAdj ? 700 : 400, textAlign: 'center', outline: 'none' }}
                />
                <button onClick={() => setFac(sp, (fac + 0.05).toFixed(2))}
                  style={{ background: '#ffffff18', border: '1px solid #ffffff22', borderRadius: 5, color: C.off, cursor: 'pointer', width: 24, height: 24, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                {isAdj && (
                  <button onClick={() => setFac(sp, 1)}
                    style={{ background: C.red + '22', border: `1px solid ${C.red}44`, borderRadius: 5, color: C.red, cursor: 'pointer', fontSize: 10, padding: '3px 6px', flexShrink: 0 }}>Reset</button>
                )}
              </div>
            </div>
          );
        })}

        {/* Total row */}
        {cl.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.8fr 0.8fr 0.7fr 0.6fr 1.4fr', borderTop: '2px solid #ffffff25', background: '#ffffff08', alignItems: 'center' }}>
            <div style={{ padding: '9px 8px', fontSize: 12, fontWeight: 700, color: C.white }}>TOTAL</div>
            <div style={{ padding: '9px 8px', fontSize: 11, color: C.g2 }}>{cl.length}</div>
            <div style={{ padding: '9px 8px', fontSize: 11, color: C.g2 }}>{Math.round(cl.reduce((a, r) => a + (r.sqft || 0), 0)).toLocaleString()}</div>
            <div style={{ padding: '9px 8px', fontSize: 12, fontWeight: 700, color: C.gold }}>{hrs.toFixed(1)}</div>
            <div style={{ padding: '9px 8px', fontSize: 13, fontWeight: 700, color: C.green }}>{fte.toFixed(2)}</div>
            <div style={{ padding: '9px 8px' }}></div>
            <div style={{ padding: '9px 8px' }}></div>
          </div>
        )}

        <div style={{ marginTop: 11, padding: '8px 11px', background: '#0D737718', borderRadius: 7, fontSize: 11, color: C.g2, borderLeft: `3px solid ${C.teal}` }}>
          FTE = weekly hours ÷ ({PROD_HRS} productive hrs × 5 days). Type a factor directly or use +/− buttons. Changes sync with the Cleaning Matrix tab automatically.
        </div>
      </Card>

      {/* Ideal Staffing Plan */}
      {cl.length > 0 && (
        <Card style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tealLt, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Ideal Staffing Plan
          </div>
          <div style={{ fontSize: 11, color: C.g2, marginBottom: 12 }}>
            If starting fresh, how many custodians are needed and on which shift?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            {SHIFT_LABELS.map(({ key, label, time, color }) => {
              const ft  = shiftFTE[key];
              const cnt = shiftStaff[key];
              return (
                <div key={key} style={{ background: '#ffffff08', borderRadius: 9, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label} Shift · {time}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'Georgia,serif' }}>{cnt}</div>
                  <div style={{ fontSize: 11, color: C.g2 }}>Full Time custodian{cnt !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 10, color: C.g3 ?? C.g2, marginTop: 4 }}>{ft.toFixed(2)} FTE</div>
                  <div style={{ marginTop: 8, fontSize: 10, color: C.g2, lineHeight: 1.5 }}>
                    {[...SHIFT_BUCKETS[key]].filter(st => bySpace[st]).map(st => (
                      <div key={st} style={{ color: C.g2 }}>· {st}</div>
                    ))}
                    {![...SHIFT_BUCKETS[key]].some(st => bySpace[st]) && (
                      <div style={{ fontStyle: 'italic' }}>No rooms in this shift</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary line */}
          <div style={{ background: '#0D737722', borderRadius: 7, padding: '10px 14px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            {SHIFT_LABELS.map(({ key, label, color }) => (
              <span key={key} style={{ fontSize: 13, fontWeight: 700, color }}>
                {label}: {shiftStaff[key]} FT
              </span>
            ))}
            <span style={{ fontSize: 12, color: C.g2, marginLeft: 'auto' }}>
              Total: {shiftStaff.day + shiftStaff.afternoon + shiftStaff.night} custodians
            </span>
          </div>

          <div style={{ padding: '7px 11px', background: '#0a2030', borderRadius: 7, fontSize: 10, color: C.g2, borderLeft: `3px solid ${C.teal}44` }}>
            Based on ISSA 612 standards with current adjustment factors applied. FTEs are rounded up to the nearest whole custodian per shift.
            {selectedBuilding !== 'All' && <span style={{ color: C.gold }}> · Filtered to: {selectedBuilding}</span>}
          </div>
        </Card>
      )}
    </div>
  );
}
