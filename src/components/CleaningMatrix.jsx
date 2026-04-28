import { useState } from 'react';
import { C } from '../theme.js';
import { SPACE_TYPES, ISSA_TASKS, FREQ_COLOR } from '../data/cleaningMatrix.js';
import { Card, Btn, Badge, PageHeader, DataGrid } from './UI.jsx';

export default function CleaningMatrix({ factors, setFactors, onSaveFactors }) {
  const [sel, setSel] = useState(SPACE_TYPES[0]);
  const [flt, setFlt] = useState('All');
  const fac = factors[sel] ?? 1;

  const tasks     = (ISSA_TASKS[sel] || []).filter(t => flt === 'All' || t.freq === flt);
  const dailyMins = (ISSA_TASKS[sel] || []).filter(t => t.freq === 'Daily').reduce((a, t) => a + t.time, 0);
  const allFreqs  = ['All', ...new Set(Object.values(ISSA_TASKS).flat().map(t => t.freq))];

  function setFac(v) {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return;
    const rounded = Math.round(n * 100) / 100;
    setFactors(p => ({ ...p, [sel]: rounded }));
    onSaveFactors?.({ ...factors, [sel]: rounded });
  }

  return (
    <div>
      <PageHeader title="Cleaning Matrix" sub="Tasks from Cleaning_matrix.xlsx (Rev2). Adjust factor per space type to calibrate to your team's pace." />

      {/* Space type selector */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {SPACE_TYPES.map(s => (
          <Btn key={s} variant={sel === s ? 'gold' : 'sec'} small onClick={() => setSel(s)}>
            {s}{(factors[s] ?? 1) !== 1 && <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.75 }}>×{factors[s]}</span>}
          </Btn>
        ))}
      </div>

      {/* Factor adjuster */}
      <Card style={{ marginBottom: 11, background: '#0a2e30', borderColor: C.teal + '44' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Adjustment Factor — {sel}
            </div>
            <div style={{ fontSize: 11, color: C.g2 }}>1.0 = ISSA standard · &gt;1 = slower · &lt;1 = faster</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Btn small variant="sec" onClick={() => setFac((fac - 0.05).toFixed(2))}>−</Btn>
            <input type="number" value={fac} step="0.05" min="0.1" max="5" onChange={e => setFac(e.target.value)}
              style={{ width: 60, background: '#ffffff15', border: `1px solid ${C.teal}`, borderRadius: 7, padding: '5px 7px', color: C.white, fontSize: 15, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
            <Btn small variant="sec" onClick={() => setFac((fac + 0.05).toFixed(2))}>+</Btn>
            {fac !== 1 && <Btn small variant="danger" onClick={() => setFactors(p => ({ ...p, [sel]: 1 }))}>Reset</Btn>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { l: 'ISSA Daily',  v: dailyMins.toFixed(1),              c: C.g2 },
              { l: 'Adjusted',    v: (dailyMins * fac).toFixed(1),       c: fac > 1 ? C.red : fac < 1 ? C.green : C.tealLt },
              { l: 'Δ',          v: `${fac >= 1 ? '+' : ''}${((dailyMins * fac) - dailyMins).toFixed(1)}`, c: fac > 1 ? C.red : fac < 1 ? C.green : C.g2 },
            ].map(k => (
              <div key={k.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.c, fontFamily: 'Georgia,serif' }}>{k.v}</div>
                <div style={{ fontSize: 9, color: C.g2, textTransform: 'uppercase' }}>{k.l} min</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Frequency filter */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 9, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.g2, fontWeight: 700, textTransform: 'uppercase' }}>Freq:</span>
        {allFreqs.map(f => (
          <button key={f} onClick={() => setFlt(f)}
            style={{ padding: '2px 8px', borderRadius: 20, border: `1px solid ${FREQ_COLOR[f] || C.g3}55`, background: flt === f ? (FREQ_COLOR[f] || C.teal) + '33' : 'transparent', color: flt === f ? (FREQ_COLOR[f] || C.tealLt) : C.g2, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.g2 }}>{tasks.length} tasks</span>
      </div>

      {/* Task table */}
      <Card>
        <DataGrid
          cols={['3fr', '1.1fr', '0.75fr', '0.85fr', '0.9fr', '0.45fr']}
          headers={['Task', 'Unit', 'ISSA (min)', 'Adjusted (min)', 'Frequency', 'Δ']}
          empty="No tasks match this filter."
          rows={tasks.map(t => {
            const adj = t.time * fac, diff = adj - t.time;
            return [
              <span style={{ color: C.off }}>{t.task}</span>,
              <span style={{ color: C.g2, fontSize: 10 }}>{t.unit}</span>,
              <span style={{ color: C.tealLt, fontWeight: 600 }}>{t.time.toFixed(1)}</span>,
              <span style={{ color: fac === 1 ? C.tealLt : fac > 1 ? C.red : C.green, fontWeight: 700 }}>{adj.toFixed(1)}</span>,
              <Badge color={FREQ_COLOR[t.freq] || C.g2}>{t.freq}</Badge>,
              <span style={{ color: diff === 0 ? C.g3 : diff > 0 ? C.red : C.green, fontSize: 11, fontWeight: 600 }}>
                {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`}
              </span>,
            ];
          })}
        />
        <div style={{ marginTop: 11, padding: '8px 11px', background: '#0D737718', borderRadius: 7, fontSize: 11, color: C.g2, borderLeft: `3px solid ${C.teal}` }}>
          <strong style={{ color: C.tealLt }}>Source:</strong> Tasks verified from <em>Cleaning_matrix.xlsx (Rev2)</em>. Factor changes flow to FTE Calculator automatically.
        </div>
      </Card>
    </div>
  );
}
