import { C, PROD_HRS } from '../theme.js';
import { Card, Badge, PageHeader, DataGrid } from './UI.jsx';
import { calcFTE } from '../utils/fte.js';

export default function FTECalculator({ rooms, factors }) {
  const cl = rooms.filter(r => r.requiresCleaning);
  const { mins, hrs, fte } = calcFTE(cl, factors);

  const bySpace = {};
  for (const r of cl) {
    if (!bySpace[r.spaceType]) bySpace[r.spaceType] = [];
    bySpace[r.spaceType].push(r);
  }

  const hasAdj = Object.entries(factors).some(([, v]) => v !== 1);

  return (
    <div>
      <PageHeader title="FTE Calculator" sub="ISSA 612 task times × unit counts × frequency × adjustment factors" />

      {hasAdj && (
        <div style={{ background: C.gold + '22', border: `1px solid ${C.gold}44`, borderRadius: 9, padding: '9px 13px', marginBottom: 13, fontSize: 12, color: C.gold }}>
          ⚡ Active factors: {Object.entries(factors).filter(([, v]) => v !== 1).map(([k, v]) => `${k} ×${v}`).join(' · ')}
        </div>
      )}

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

      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.tealLt, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.07em' }}>By Space Type</div>
        <DataGrid
          cols={['2fr', '0.6fr', '0.9fr', '0.8fr', '0.8fr', '0.7fr']}
          headers={['Space Type', 'Rooms', 'Sq Ft', 'Wkly Mins', 'Wkly Hrs', 'FTE']}
          empty="Add rooms to see calculations"
          rows={[
            ...Object.entries(bySpace).map(([sp, rl]) => {
              const r  = calcFTE(rl, factors);
              const sq = rl.reduce((a, x) => a + (x.sqft || 0), 0);
              return [
                <span style={{ color: C.tealLt }}>{sp}</span>,
                rl.length,
                Math.round(sq).toLocaleString(),
                Math.round(r.mins).toLocaleString(),
                r.hrs.toFixed(1),
                <strong style={{ color: C.gold }}>{r.fte.toFixed(2)}</strong>,
              ];
            }),
            cl.length ? [
              <strong style={{ color: C.white }}>TOTAL</strong>,
              cl.length,
              Math.round(cl.reduce((a, r) => a + (r.sqft || 0), 0)).toLocaleString(),
              Math.round(mins).toLocaleString(),
              hrs.toFixed(1),
              <strong style={{ color: C.green }}>{fte.toFixed(2)}</strong>,
            ] : [],
          ].filter(r => r.length)}
        />
        <div style={{ marginTop: 11, padding: '8px 11px', background: '#0D737718', borderRadius: 7, fontSize: 11, color: C.g2, borderLeft: `3px solid ${C.teal}` }}>
          FTE = weekly hours ÷ ({PROD_HRS} productive hrs × 5 days). Assumes 1hr for breaks/travel per 8hr shift.
        </div>
      </Card>
    </div>
  );
}
