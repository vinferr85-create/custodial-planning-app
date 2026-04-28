import { C } from '../theme.js';
import { Card, Badge, PageHeader } from './UI.jsx';
import { buildSchedule } from '../utils/scheduleBuilder.js';

export default function WorkloadBalance({ rooms, custs }) {
  if (!custs.length) {
    return (
      <div>
        <PageHeader title="Workload Balance" />
        <Card><p style={{ color: C.g2, textAlign: 'center', padding: 32 }}>Add custodians to see balance.</p></Card>
      </div>
    );
  }

  const sched  = buildSchedule(custs, rooms);
  const totals = sched.map(c => c.weeklySqft);
  const avg    = totals.reduce((a, b) => a + b, 0) / (totals.length || 1);
  const max    = Math.max(...totals, 1);

  return (
    <div>
      <PageHeader title="Workload Balance" sub="Weekly sq footage per custodian. Within ±15% of average = balanced." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Avg Weekly Sqft', v: Math.round(avg).toLocaleString() },
          { l: 'Target / Day',    v: Math.round(avg / 5).toLocaleString() },
          { l: 'Balanced',        v: `${sched.filter(c => avg > 0 && Math.abs(c.weeklySqft - avg) / avg < 0.15).length}/${sched.length}` },
        ].map(k => (
          <Card key={k.l}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, fontFamily: 'Georgia,serif', textAlign: 'center' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: C.g2, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{k.l}</div>
          </Card>
        ))}
      </div>

      <Card>
        {sched.map(c => {
          const dev = avg > 0 ? (c.weeklySqft - avg) / avg : 0;
          const bc  = Math.abs(dev) > 0.15 ? C.red : Math.abs(dev) > 0.08 ? C.amber : C.green;
          return (
            <div key={c.id} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: C.off, fontWeight: 500 }}>{c.name}</span>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.g2 }}>{c.building}</span>
                  <Badge color={bc}>{dev >= 0 ? '+' : ''}{(dev * 100).toFixed(1)}%</Badge>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.gold, minWidth: 75, textAlign: 'right' }}>{Math.round(c.weeklySqft).toLocaleString()} sqft</span>
                </div>
              </div>
              <div style={{ background: '#ffffff10', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                <div style={{ width: `${(c.weeklySqft / max) * 100}%`, height: '100%', background: bc, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 13, paddingTop: 9, borderTop: '1px solid #ffffff15', display: 'flex', gap: 14, fontSize: 11, color: C.g2 }}>
          <span>🟢 ±8%</span><span>🟡 ±15%</span><span>🔴 Outside ±15% — reassign rooms</span>
        </div>
      </Card>
    </div>
  );
}
