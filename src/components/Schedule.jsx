import { useState } from 'react';
import { C, DAYS } from '../theme.js';
import { Card, Btn, Badge, PageHeader } from './UI.jsx';
import { buildSchedule } from '../utils/scheduleBuilder.js';

const DAY_COLOR = { Monday: C.teal, Tuesday: '#1a6b9a', Wednesday: C.teal, Thursday: '#1a6b9a', Friday: C.teal, Saturday: C.green, Sunday: '#c05621' };

export default function Schedule({ rooms, custs }) {
  const [sched, setSched] = useState(null);
  const [fShift, setFS]   = useState('All');
  const [fBldg,  setFB]   = useState('All');

  const bldgs = ['All', ...new Set(custs.map(c => c.building))];
  const shown  = (sched || []).filter(c => {
    if (fShift !== 'All' && !c.shift.toLowerCase().includes(fShift.toLowerCase())) return false;
    if (fBldg  !== 'All' && c.building !== fBldg) return false;
    return true;
  });

  if (!sched) {
    return (
      <div>
        <PageHeader title="7-Day Schedule" sub="Workload-balanced schedule from your roster and room inventory." />
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>📅</div>
            <h3 style={{ fontSize: 18, fontFamily: 'Georgia,serif', color: C.white, marginBottom: 8 }}>Ready to Generate</h3>
            <p style={{ color: C.g2, fontSize: 12, marginBottom: 20 }}>Complete Room Inventory and Custodian Roster first.</p>
            <Btn variant="gold" onClick={() => setSched(buildSchedule(custs, rooms))}>▶ Generate 7-Day Schedule</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="7-Day Schedule" />
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 13, flexWrap: 'wrap' }}>
        <Btn variant="gold" small onClick={() => setSched(buildSchedule(custs, rooms))}>↺ Regenerate</Btn>
        <span style={{ color: C.g2, fontSize: 11 }}>Shift:</span>
        {['All', 'Day', 'Afternoon', 'Night'].map(s => <Btn key={s} small variant={fShift === s ? 'pri' : 'sec'} onClick={() => setFS(s)}>{s}</Btn>)}
        <span style={{ color: C.g2, fontSize: 11 }}>Building:</span>
        {bldgs.map(b => <Btn key={b} small variant={fBldg === b ? 'pri' : 'sec'} onClick={() => setFB(b)}>{b.length > 12 ? b.split(' ')[0] : b}</Btn>)}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.g2 }}>{shown.length} custodians</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              {['Custodian', 'Building', 'Shift', ...DAYS, 'Wkly Sqft'].map((h, i) => (
                <th key={h} style={{
                  padding: '7px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
                  background: i >= 3 && i <= 9 ? DAY_COLOR[h] || C.slate : C.slate,
                  color: C.white, borderRight: '1px solid #ffffff15', borderBottom: '2px solid #ffffff25',
                  position: i < 3 ? 'sticky' : 'static',
                  left: i === 0 ? 0 : i === 1 ? 160 : i === 2 ? 310 : 'auto',
                  zIndex: i < 3 ? 2 : 1,
                  minWidth: i === 0 ? 160 : i === 1 ? 150 : i === 2 ? 125 : i === 10 ? 85 : 138,
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((c, ci) => (
              <tr key={c.id} style={{ background: ci % 2 === 0 ? '#ffffff06' : 'transparent' }}>
                <td style={{ padding: 8, fontSize: 12, fontWeight: 600, color: C.white, borderRight: '1px solid #ffffff10', position: 'sticky', left: 0, background: ci % 2 === 0 ? '#0f2640' : '#0B1F3A', zIndex: 1 }}>{c.name}</td>
                <td style={{ padding: 8, fontSize: 11, color: C.g2,   borderRight: '1px solid #ffffff10', position: 'sticky', left: 160, background: ci % 2 === 0 ? '#0f2640' : '#0B1F3A', zIndex: 1 }}>{c.building}</td>
                <td style={{ padding: 8, borderRight: '1px solid #ffffff10', position: 'sticky', left: 310, background: ci % 2 === 0 ? '#0f2640' : '#0B1F3A', zIndex: 1 }}>
                  <Badge color={c.shiftType === 'night' ? '#9F7AEA' : c.shiftType === 'afternoon' ? C.gold : C.green}>
                    {c.shiftType === 'night' ? 'Night' : c.shiftType === 'afternoon' ? 'Aft' : 'Day'}
                  </Badge>
                </td>
                {DAYS.map(day => {
                  const dd = c.days[day];
                  if (dd.off) return <td key={day} style={{ padding: '7px 8px', fontSize: 11, color: C.g3, textAlign: 'center', borderRight: '1px solid #ffffff08', background: '#ffffff03' }}>—OFF—</td>;
                  const st = c.shiftType || 'day';
                  const bg = dd.wknd ? '#1a4d2e22' : st === 'night' ? '#2d1b6922' : st === 'afternoon' ? '#E8A83815' : '#0D737715';
                  const fc = dd.wknd ? C.green : st === 'night' ? '#9F7AEA' : st === 'afternoon' ? C.gold : C.tealLt;
                  return (
                    <td key={day} style={{ padding: '7px 8px', fontSize: 10, verticalAlign: 'top', borderRight: '1px solid #ffffff08', background: bg, minWidth: 138 }}>
                      {dd.tasks.map((t, ti) => (
                        <div key={ti} style={{ marginBottom: 4, paddingBottom: 4, borderBottom: ti < dd.tasks.length - 1 ? '1px solid #ffffff10' : 'none' }}>
                          <div style={{ fontWeight: 600, color: fc, marginBottom: 1, fontSize: 10 }}>{t.spaceType}</div>
                          <div style={{ color: C.g2, fontSize: 9, lineHeight: 1.4 }}>{t.desc}</div>
                          <div style={{ color: '#ffffff30', fontSize: 9 }}>{t.rooms}</div>
                        </div>
                      ))}
                      {!dd.tasks.length && <span style={{ color: C.g3, fontSize: 10 }}>No tasks</span>}
                      <div style={{ marginTop: 3, paddingTop: 3, borderTop: '1px solid #ffffff12', fontSize: 9, color: C.g2, fontWeight: 600 }}>
                        {Math.round(dd.sqft || 0).toLocaleString()} sqft{dd.wknd && <span style={{ color: C.green }}> ★wkly</span>}
                      </div>
                    </td>
                  );
                })}
                <td style={{ padding: 8, fontSize: 12, fontWeight: 700, color: C.gold, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {Math.round(c.weeklySqft || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
