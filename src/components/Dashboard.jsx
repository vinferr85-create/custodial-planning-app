import { C } from '../theme.js';
import { Card, PageHeader, DataGrid } from './UI.jsx';
import { calcFTE } from '../utils/fte.js';

export default function Dashboard({ rooms, custs, factors }) {
  const cl   = rooms.filter(r => r.requiresCleaning);
  const sqft = cl.reduce((a, r) => a + (r.sqft || 0), 0);
  const { hrs, fte } = calcFTE(cl, factors);
  const gap  = Math.max(0, Math.ceil(fte) - custs.length);

  const bldgMap = {};
  for (const r of cl) {
    if (!bldgMap[r.building]) bldgMap[r.building] = { sqft: 0, rooms: 0 };
    bldgMap[r.building].sqft  += r.sqft || 0;
    bldgMap[r.building].rooms += 1;
  }

  const kpis = [
    { l: 'Buildings',          v: new Set(rooms.map(r => r.building)).size, c: C.tealLt },
    { l: 'Cleanable Rooms',    v: cl.length,                                c: C.tealLt },
    { l: 'Total Sq Ft',        v: Math.round(sqft).toLocaleString(),        c: C.gold   },
    { l: 'Weekly Labour Hrs',  v: hrs.toFixed(1),                           c: C.gold   },
    { l: 'FTEs Required',      v: fte.toFixed(2),                           c: fte > custs.length ? C.red : C.green },
    { l: 'Custodians Rostered',v: custs.length,                             c: gap > 0  ? C.red : C.green },
  ];

  return (
    <div>
      <PageHeader title="Operations Dashboard" sub="Live totals calculated from ISSA 612 times × your adjustment factors" />

      {gap > 0 && (
        <div style={{ background: C.red + '22', border: `1px solid ${C.red}44`, borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: C.red }}>
          ⚠️ Staffing gap: need <strong>{Math.ceil(fte)}</strong>, have <strong>{custs.length}</strong>. Add {gap} more custodians.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {kpis.map(k => (
          <Card key={k.l}>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.c, fontFamily: 'Georgia,serif', textAlign: 'center' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: C.g2, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{k.l}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.tealLt, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>By Building</div>
        <DataGrid
          cols={['2fr', '1fr', '1fr', '1fr']}
          headers={['Building', 'Rooms', 'Sq Ft', 'Custodians']}
          empty="No rooms added yet"
          rows={Object.entries(bldgMap).map(([b, d]) => [
            b,
            d.rooms,
            Math.round(d.sqft).toLocaleString(),
            custs.filter(c => c.building === b).length,
          ])}
        />
      </Card>
    </div>
  );
}
