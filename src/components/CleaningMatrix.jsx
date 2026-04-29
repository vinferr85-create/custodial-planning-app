import { useState } from 'react';
import { C } from '../theme.js';
import { SPACE_TYPES, ISSA_TASKS, FREQ_COLOR, UNIT_LABEL } from '../data/cleaningMatrix.js';
import { Card, Btn, Badge, PageHeader } from './UI.jsx';

function buildInitialTasks() {
  return Object.fromEntries(
    Object.entries(ISSA_TASKS).map(([sp, tasks]) => [sp, tasks.map((t, i) => ({ ...t, id: `${sp}-${i}` }))])
  );
}

const FREQ_OPTIONS = ['Daily','2x Weekly','Weekly','Monthly','Quarterly','6 Months','Annual','As required','On Demand'];
const UNIT_OPTIONS = Object.entries(UNIT_LABEL).map(([k, v]) => ({ code: k, label: v }));

export default function CleaningMatrix({ factors, setFactors, onSaveFactors }) {
  const [allTasks, setAllTasks]       = useState(buildInitialTasks);
  const [allTypes, setAllTypes]       = useState(SPACE_TYPES);
  const [sel, setSel]                 = useState(SPACE_TYPES[0]);
  const [flt, setFlt]                 = useState('All');
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask]         = useState({ task: '', unit: 's', time: '', freq: 'Daily' });

  const fac       = factors[sel] ?? 1;
  const selTasks  = allTasks[sel] || [];
  const tasks     = selTasks.filter(t => flt === 'All' || t.freq === flt);
  const dailyMins = selTasks.filter(t => t.freq === 'Daily').reduce((a, t) => a + t.time, 0);
  const allFreqs  = ['All', ...new Set(Object.values(allTasks).flat().map(t => t.freq))];

  function setFac(v) {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return;
    const rounded = Math.round(n * 100) / 100;
    setFactors(p => ({ ...p, [sel]: rounded }));
    onSaveFactors?.({ ...factors, [sel]: rounded });
  }

  function removeTask(taskId) {
    setAllTasks(p => ({ ...p, [sel]: p[sel].filter(t => t.id !== taskId) }));
  }

  function addManualTask() {
    if (!newTask.task || !newTask.time) return;
    const id   = `${sel}-custom-${Date.now()}`;
    const unit = UNIT_LABEL[newTask.unit] || 'per 100 sqft';
    setAllTasks(p => ({ ...p, [sel]: [...(p[sel] || []), { ...newTask, unit, uc: newTask.unit, time: parseFloat(newTask.time), id }] }));
    setNewTask({ task: '', unit: 's', time: '', freq: 'Daily' });
    setShowAddTask(false);
  }

  async function generateSpaceType() {
    if (!newTypeName.trim()) { setAiError('Please enter a space type name.'); return; }
    if (allTypes.includes(newTypeName.trim())) { setAiError('That space type already exists.'); return; }
    setAiLoading(true); setAiError('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1500,
          messages: [{ role: 'user', content: `You are a facilities management expert using ISSA 612 cleaning standards. Generate a cleaning task list for this space type: "${newTypeName}"${newTypeDesc ? `. Context: ${newTypeDesc}` : ''}. Return ONLY a valid JSON array with no markdown. Each item must have: "task" (string), "unit" (one of: s=per 100 sqft, f=per fixture/unit, b=per bin, d=per dispenser, m=per mirror, a=per appliance, t=per mat), "time" (number, ISSA minutes per unit), "freq" (one of: Daily, 2x Weekly, Weekly, Monthly, Quarterly, 6 Months, Annual, As required). Include 8-15 realistic tasks.` }],
        }),
      });
      const data = await res.json();
      const text = (data.content?.[0]?.text || '[]').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || !parsed.length) { setAiError('AI returned unexpected format. Try again.'); setAiLoading(false); return; }
      const name = newTypeName.trim();
      const taskList = parsed.map((t, i) => ({ task: t.task, unit: UNIT_LABEL[t.unit] || 'per 100 sqft', uc: t.unit || 's', time: parseFloat(t.time) || 2, freq: t.freq || 'Daily', id: `${name}-${i}` }));
      setAllTypes(p => [...p, name]);
      setAllTasks(p => ({ ...p, [name]: taskList }));
      setSel(name); setNewTypeName(''); setNewTypeDesc(''); setShowAddType(false);
    } catch (e) { setAiError('Error: ' + e.message); }
    finally { setAiLoading(false); }
  }

  function removeSpaceType(name) {
    if (SPACE_TYPES.includes(name)) return;
    setAllTypes(p => p.filter(t => t !== name));
    setAllTasks(p => { const n = { ...p }; delete n[name]; return n; });
    setSel(allTypes.find(t => t !== name) || allTypes[0]);
  }

  const IS = { background: '#ffffff0d', border: '1px solid #ffffff22', borderRadius: 7, padding: '7px 9px', color: C.off, fontSize: 12, outline: 'none' };
  const LBL = { fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div>
      <PageHeader title="Cleaning Matrix" sub="Tasks from Cleaning_matrix.xlsx (Rev2). Remove tasks, add custom space types, or adjust the factor." />

      {/* Space type buttons */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        {allTypes.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Btn variant={sel === s ? 'gold' : 'sec'} small onClick={() => setSel(s)}>
              {s}{(factors[s] ?? 1) !== 1 && <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.75 }}>×{factors[s]}</span>}
            </Btn>
            {!SPACE_TYPES.includes(s) && (
              <button onClick={() => removeSpaceType(s)} title="Remove custom space type"
                style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 11, padding: '0 3px' }}>✕</button>
            )}
          </div>
        ))}
        <Btn small variant="pri" onClick={() => { setShowAddType(p => !p); setAiError(''); }}>
          {showAddType ? '✕ Cancel' : '+ Add Space Type'}
        </Btn>
      </div>

      {/* Add space type panel */}
      {showAddType && (
        <Card style={{ marginBottom: 12, background: '#0a2e30', borderColor: C.teal + '44' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tealLt, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Add New Space Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={LBL}>Space Type Name *</span>
              <input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="e.g. Server Room, Chapel, Laundry Room"
                style={{ ...IS, border: `1px solid ${C.teal}` }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={LBL}>Description (optional — helps AI generate better tasks)</span>
              <input value={newTypeDesc} onChange={e => setNewTypeDesc(e.target.value)} placeholder="e.g. Small room with IT equipment, hard floor, no windows"
                style={IS} />
            </label>
          </div>
          {aiError && <div style={{ fontSize: 12, color: C.red, marginBottom: 8 }}>{aiError}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn variant="gold" onClick={generateSpaceType} disabled={aiLoading}>
              {aiLoading ? '⟳ Generating tasks…' : '✨ Generate Tasks with AI'}
            </Btn>
            <span style={{ fontSize: 11, color: C.g2 }}>AI creates an ISSA-standard task list for your new space type.</span>
          </div>
        </Card>
      )}

      {/* Factor adjuster */}
      <Card style={{ marginBottom: 11, background: '#0a2e30', borderColor: C.teal + '44' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ ...LBL, marginBottom: 2 }}>Adjustment Factor — {sel}</div>
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
              { l: 'ISSA Daily', v: dailyMins.toFixed(1), c: C.g2 },
              { l: 'Adjusted',   v: (dailyMins * fac).toFixed(1), c: fac > 1 ? C.red : fac < 1 ? C.green : C.tealLt },
              { l: 'Δ', v: `${fac >= 1 ? '+' : ''}${((dailyMins * fac) - dailyMins).toFixed(1)}`, c: fac > 1 ? C.red : fac < 1 ? C.green : C.g2 },
            ].map(k => (
              <div key={k.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.c, fontFamily: 'Georgia,serif' }}>{k.v}</div>
                <div style={{ fontSize: 9, color: C.g2, textTransform: 'uppercase' }}>{k.l} min</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Frequency filter + Add Task */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 9, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.g2, fontWeight: 700, textTransform: 'uppercase' }}>Freq:</span>
        {allFreqs.map(f => (
          <button key={f} onClick={() => setFlt(f)}
            style={{ padding: '2px 8px', borderRadius: 20, border: `1px solid ${FREQ_COLOR[f] || C.g3}55`, background: flt === f ? (FREQ_COLOR[f] || C.teal) + '33' : 'transparent', color: flt === f ? (FREQ_COLOR[f] || C.tealLt) : C.g2, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
        <span style={{ fontSize: 10, color: C.g2 }}>{tasks.length} tasks</span>
        <Btn small variant="pri" style={{ marginLeft: 'auto' }} onClick={() => setShowAddTask(p => !p)}>
          {showAddTask ? '✕ Cancel' : '+ Add Task'}
        </Btn>
      </div>

      {/* Add task panel */}
      {showAddTask && (
        <Card style={{ marginBottom: 10, background: '#0a2030', borderColor: C.teal + '33' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.tealLt, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Add Task to {sel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 0.7fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={LBL}>Task Description *</span>
              <input value={newTask.task} onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))} placeholder="e.g. Wipe light switches" style={IS} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={LBL}>Unit</span>
              <select value={newTask.unit} onChange={e => setNewTask(p => ({ ...p, unit: e.target.value }))} style={IS}>
                {UNIT_OPTIONS.map(u => <option key={u.code} value={u.code} style={{ background: C.slate }}>{u.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={LBL}>Time (min) *</span>
              <input type="number" min="0.1" step="0.5" value={newTask.time} onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))} placeholder="2.5" style={IS} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={LBL}>Frequency</span>
              <select value={newTask.freq} onChange={e => setNewTask(p => ({ ...p, freq: e.target.value }))} style={IS}>
                {FREQ_OPTIONS.map(f => <option key={f} value={f} style={{ background: C.slate }}>{f}</option>)}
              </select>
            </label>
            <Btn variant="gold" onClick={addManualTask}>Add</Btn>
          </div>
        </Card>
      )}

      {/* Task table */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.1fr 0.75fr 0.85fr 0.9fr 0.45fr 0.3fr', borderBottom: '1px solid #ffffff20' }}>
          {['Task', 'Unit', 'ISSA (min)', 'Adjusted (min)', 'Frequency', 'Δ', ''].map(h => (
            <div key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>
        {tasks.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.g2, fontSize: 13 }}>No tasks match this filter.</div>}
        {tasks.map((t, i) => {
          const adj = t.time * fac, diff = adj - t.time;
          return (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1.1fr 0.75fr 0.85fr 0.9fr 0.45fr 0.3fr', background: i % 2 === 0 ? '#ffffff05' : 'transparent', borderBottom: '1px solid #ffffff08' }}>
              <div style={{ padding: '8px 8px', fontSize: 11, color: C.off, display: 'flex', alignItems: 'center' }}>{t.task}</div>
              <div style={{ padding: '8px 8px', fontSize: 10, color: C.g2, display: 'flex', alignItems: 'center' }}>{t.unit}</div>
              <div style={{ padding: '8px 8px', fontSize: 11, color: C.tealLt, fontWeight: 600, display: 'flex', alignItems: 'center' }}>{t.time.toFixed(1)}</div>
              <div style={{ padding: '8px 8px', fontSize: 11, color: fac === 1 ? C.tealLt : fac > 1 ? C.red : C.green, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{adj.toFixed(1)}</div>
              <div style={{ padding: '8px 8px', display: 'flex', alignItems: 'center' }}><Badge color={FREQ_COLOR[t.freq] || C.g2}>{t.freq}</Badge></div>
              <div style={{ padding: '8px 8px', fontSize: 11, color: diff === 0 ? C.g3 : diff > 0 ? C.red : C.green, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`}
              </div>
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <button onClick={() => removeTask(t.id)} title="Remove this task"
                  style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 14, padding: '2px 4px', borderRadius: 4, opacity: 0.7 }}>✕</button>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 11, padding: '8px 11px', background: '#0D737718', borderRadius: 7, fontSize: 11, color: C.g2, borderLeft: `3px solid ${C.teal}` }}>
          <strong style={{ color: C.tealLt }}>Tip:</strong> Click <strong style={{ color: C.red }}>✕</strong> on any row to remove a task · <strong style={{ color: C.tealLt }}>+ Add Task</strong> to add manually · <strong style={{ color: C.tealLt }}>+ Add Space Type</strong> to create a new type with AI-generated tasks.
        </div>
      </Card>
    </div>
  );
}
