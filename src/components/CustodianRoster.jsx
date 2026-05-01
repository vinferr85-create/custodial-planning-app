import { useState } from 'react';
import * as XLSX from 'xlsx';
import { C, uid, SHIFTS, DOFF } from '../theme.js';
import { findCol } from '../utils/spaceTypeMatcher.js';
import { Card, Btn, Badge, Input, Select, PageHeader, StatusBar } from './UI.jsx';

function shiftColor(shift) {
  if (!shift) return C.g2;
  const s = shift.toLowerCase();
  if (s.includes('day'))       return C.green;
  if (s.includes('afternoon')) return C.gold;
  if (s.includes('night'))     return '#9F7AEA';
  return C.g2;
}

function shiftLabel(shift) {
  if (!shift) return '—';
  const s = shift.toLowerCase();
  if (s.includes('day'))       return 'Day';
  if (s.includes('afternoon')) return 'Aft';
  if (s.includes('night'))     return 'Night';
  return shift.split(' ')[0];
}

const EMPTY_FORM = {
  name: '', building: '', shift: SHIFTS[0], daysOff: DOFF[0], fte: 'Full Time', customTime: '',
};

export default function CustodianRoster({ custs, setCusts, rooms, onAdd, onDelete, onUpdate }) {
  const bldgs = [...new Set(rooms.map(r => r.building).filter(Boolean))];
  const [f, setF]           = useState({ ...EMPTY_FORM, building: bldgs[0] || '' });
  const [editId, setEditId] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [us,   setUS]  = useState('idle');
  const [msg,  setMsg] = useState('');
  const [prev, setPrev] = useState(null);
  const [drag, setDrag] = useState(false);
  const upd = k => v => setF(p => ({ ...p, [k]: v }));

  function defaultTime(shift) {
    if (shift.includes('Afternoon')) return '2:00pm–10:30pm';
    if (shift.includes('Night'))     return '10:00pm–6:30am';
    return '7:00am–3:30pm';
  }

  function add() {
    if (!f.name || !f.building) return;
    const shiftDisplay = f.customTime
      ? f.shift.replace(/\(.*?\)/, `(${f.customTime})`)
      : f.shift;
    const cust = { ...f, shift: shiftDisplay, id: uid() };
    onAdd ? onAdd(cust) : setCusts(p => [...p, cust]);
    setF(p => ({ ...EMPTY_FORM, building: p.building, shift: p.shift }));
  }

  function remove(id) {
    onDelete ? onDelete(id) : setCusts(p => p.filter(x => x.id !== id));
  }

  function startEdit(c) {
    setEditId(c.id);
    setEditVals({ name: c.name, building: c.building, shift: c.shift, daysOff: c.daysOff, fte: c.fte });
  }

  function saveEdit(id) {
    const updated = { ...custs.find(c => c.id === id), ...editVals };
    onUpdate ? onUpdate(id, updated) : setCusts(p => p.map(c => c.id === id ? updated : c));
    setEditId(null); setEditVals({});
  }

  // ── Custodian Excel parser ───────────────────────────────────────────────
  function parseCustodianRow(row) {
    const sv = (v, d = '') => String(v === undefined ? d : (v || d)).trim();

    function matchShift(raw) {
      if (!raw) return SHIFTS[0];
      const l = raw.toLowerCase();
      if (l.includes('afternoon') || l.includes('aft') || l.includes('evening'))
        return SHIFTS.find(s => s.toLowerCase().includes('afternoon')) || SHIFTS[0];
      if (l.includes('night') || l.includes('overnight'))
        return SHIFTS.find(s => s.toLowerCase().includes('night')) || SHIFTS[0];
      return SHIFTS.find(s => s.toLowerCase().includes('day')) || SHIFTS[0];
    }

    function matchDaysOff(raw) {
      if (!raw) return DOFF[0];
      const exact = DOFF.find(d => d.toLowerCase() === raw.toLowerCase());
      return exact || DOFF[0];
    }

    function matchFte(raw) {
      if (!raw) return 'Full Time';
      const l = raw.toLowerCase();
      if (l.includes('part') || l === 'pt') return 'Part Time';
      if (l.includes('casual') || l.includes('contract') || l.includes('temp')) return 'Casual';
      return 'Full Time';
    }

    return {
      name:    sv(findCol(row, ['employeename','fullname','custodianname','name','employee','custodian','staff','personnel'])),
      building: sv(findCol(row, ['buildingname','building','bldgname','bldg','location','site'])),
      shift:   matchShift(sv(findCol(row, ['shifttype','shiftname','shift','schedule','workschedule']))),
      daysOff: matchDaysOff(sv(findCol(row, ['daysoff','daysofftype','offdays','dayoff','days']))),
      fte:     matchFte(sv(findCol(row, ['ftetype','employmenttype','employment','fte','type','position']))),
    };
  }

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls','csv'].includes(ext)) { setUS('error'); setMsg('Please upload .xlsx, .xls, or .csv'); return; }
    setUS('parsing'); setMsg(`Reading ${file.name}…`);
    try {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) { setUS('error'); setMsg('No data rows found.'); return; }
      const parsed = rows.map(parseCustodianRow).filter(r => r.name);
      if (!parsed.length) { setUS('error'); setMsg('No valid rows found — make sure a Name column exists.'); return; }
      setPrev(parsed.map(r => ({ ...r, id: uid() })));
      setUS('review'); setMsg(`${parsed.length} custodians found — review and import.`);
    } catch (e) { setUS('error'); setMsg('Error reading file: ' + e.message); }
  }

  async function commitImport() {
    const count = prev.length;
    for (const { id, ...c } of prev) {
      if (onAdd) await onAdd(c);
      else setCusts(p => [...p, { ...c, id }]);
    }
    setPrev(null); setUS('done'); setMsg(`✓ ${count} custodians imported.`);
    setTimeout(() => setUS('idle'), 3000);
  }

  const IS  = { background: '#ffffff0d', border: '1px solid #ffffff22', borderRadius: 7, padding: '6px 8px', color: C.off, fontSize: 12, outline: 'none', width: '100%' };
  const LBL = { fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const TH  = { padding: '5px 8px', fontSize: 9, fontWeight: 700, color: C.g2, textTransform: 'uppercase', background: C.slate, borderBottom: '1px solid #ffffff20' };
  const TD  = { padding: '6px 8px', fontSize: 11, borderBottom: '1px solid #ffffff08', display: 'flex', alignItems: 'center' };

  return (
    <div>
      <PageHeader title="Custodian Roster" sub="Assign each custodian a building, shift, and days off. Shift times can be customised per person." />

      {/* ── Manual add form ─────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.tealLt, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Add Custodian</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.8fr 1fr 0.9fr', gap: 7, marginBottom: 8 }}>
          <Input  label="Full Name"  value={f.name}     onChange={upd('name')}     placeholder="Jane Smith" />
          <Select label="Building"   value={f.building}  onChange={upd('building')} options={bldgs.length ? bldgs : ['—']} />
          <Select label="Shift"      value={f.shift}     onChange={v => { upd('shift')(v); upd('customTime')(''); }} options={SHIFTS} />
          <Select label="Days Off"   value={f.daysOff}   onChange={upd('daysOff')}  options={DOFF} />
          <Select label="FTE Type"   value={f.fte}       onChange={upd('fte')}      options={['Full Time', 'Part Time', 'Casual']} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 7, marginBottom: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ ...LBL, marginBottom: 3 }}>Custom Shift Time (optional)</div>
            <div style={{ fontSize: 10, color: C.g2, marginBottom: 4 }}>Override the standard time — e.g. <em>7:30am–4:00pm</em></div>
            <input value={f.customTime} onChange={e => upd('customTime')(e.target.value)}
              placeholder={`Default: ${defaultTime(f.shift)}`} style={IS} />
          </div>
          <div style={{ fontSize: 11, color: C.g2, padding: '4px 0' }}>
            Standard times: &nbsp;
            <span style={{ color: C.green }}>Day 7:00am–3:30pm</span> · &nbsp;
            <span style={{ color: C.gold }}>Afternoon 2:00pm–10:30pm</span> · &nbsp;
            <span style={{ color: '#9F7AEA' }}>Night 10:00pm–6:30am</span>
          </div>
        </div>
        <Btn onClick={add}>+ Add Custodian</Btn>
      </Card>

      {/* ── Excel upload ─────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.tealLt, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>📂 Import from Spreadsheet</div>
        <div style={{ fontSize: 11, color: C.g2, marginBottom: 10, lineHeight: 1.6 }}>
          Upload <strong style={{ color: C.off }}>.xlsx, .xls, or .csv</strong>. Columns auto-detected.<br />
          Expected: <span style={{ color: C.tealLt }}>Name · Building · Shift · Days Off · FTE Type</span>
        </div>

        {us !== 'review' && (
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('custUpload').click()}
            style={{ border: `2px dashed ${drag ? C.tealLt : C.teal}`, borderRadius: 9, padding: 20, textAlign: 'center', cursor: 'pointer', background: drag ? '#0D737720' : 'transparent', marginBottom: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>👷</div>
            <div style={{ fontSize: 13, color: drag ? C.tealLt : C.off, fontWeight: 500 }}>Drop here or click to browse</div>
            <div style={{ fontSize: 11, color: C.g2, marginTop: 2 }}>Excel or CSV</div>
            <input id="custUpload" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }} />
          </div>
        )}

        {us !== 'idle' && us !== 'review' && <StatusBar state={us} message={msg} />}

        {us === 'review' && prev && (
          <>
            <div style={{ padding: '9px 12px', borderRadius: 7, fontSize: 11, background: C.gold + '22', color: C.gold, border: `1px solid ${C.gold}44`, marginBottom: 8 }}>{msg}</div>
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #ffffff15', borderRadius: 7, marginBottom: 8 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1.8fr 0.9fr 0.9fr 0.3fr', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Name','Building','Shift','Days Off','FTE',''].map(h => (
                  <div key={h} style={TH}>{h}</div>
                ))}
              </div>
              {prev.map((r, i) => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1.8fr 0.9fr 0.9fr 0.3fr', background: i % 2 === 0 ? '#ffffff05' : 'transparent' }}>
                  <div style={TD}><span style={{ color: C.white, fontWeight: 500 }}>{r.name}</span></div>
                  <div style={TD}><span style={{ color: C.g2 }}>{r.building || <em style={{ color: C.red }}>missing</em>}</span></div>
                  <div style={{ ...TD, padding: '4px 6px' }}>
                    <select value={r.shift}
                      onChange={e => setPrev(p => p.map(x => x.id === r.id ? { ...x, shift: e.target.value } : x))}
                      style={{ ...IS, fontSize: 10, padding: '4px 6px' }}>
                      {SHIFTS.map(s => <option key={s} value={s} style={{ background: C.slate }}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ ...TD, padding: '4px 6px' }}>
                    <select value={r.daysOff}
                      onChange={e => setPrev(p => p.map(x => x.id === r.id ? { ...x, daysOff: e.target.value } : x))}
                      style={{ ...IS, fontSize: 10, padding: '4px 6px' }}>
                      {DOFF.map(d => <option key={d} value={d} style={{ background: C.slate }}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ ...TD, padding: '4px 6px' }}>
                    <select value={r.fte}
                      onChange={e => setPrev(p => p.map(x => x.id === r.id ? { ...x, fte: e.target.value } : x))}
                      style={{ ...IS, fontSize: 10, padding: '4px 6px' }}>
                      {['Full Time','Part Time','Casual'].map(ft => <option key={ft} value={ft} style={{ background: C.slate }}>{ft}</option>)}
                    </select>
                  </div>
                  <div style={{ ...TD, justifyContent: 'center', padding: '4px' }}>
                    <Btn small variant="danger"
                      onClick={() => setPrev(p => { const next = p.filter(x => x.id !== r.id); if (!next.length) { setPrev(null); setUS('idle'); } return next; })}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <Btn variant="gold" onClick={commitImport}>✓ Import {prev.length} Custodians</Btn>
              <Btn variant="sec"  onClick={() => { setPrev(null); setUS('idle'); setMsg(''); }}>Cancel</Btn>
            </div>
          </>
        )}
        {us === 'idle' && (
          <div style={{ marginTop: 7, fontSize: 11, color: C.g2 }}>
            💡 Column names are flexible — "Employee Name", "Full Name", "Shift Type" etc. all work. Shift and FTE are editable in the preview.
          </div>
        )}
      </Card>

      {/* ── Roster table ─────────────────────────────────────────────────── */}
      <Card>
        <div style={{ fontSize: 12, color: C.g2, marginBottom: 9 }}>{custs.length} custodians rostered</div>
        {custs.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.g2, fontSize: 13 }}>No custodians added yet.</div>}
        {custs.map((c, i) => (
          <div key={c.id} style={{ background: i % 2 === 0 ? '#ffffff05' : 'transparent', borderBottom: '1px solid #ffffff08', padding: '8px 10px' }}>
            {editId === c.id ? (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.8fr 1fr 0.9fr auto auto', gap: 7, alignItems: 'flex-end' }}>
                <input value={editVals.name} onChange={e => setEditVals(p => ({ ...p, name: e.target.value }))} style={IS} />
                <select value={editVals.building} onChange={e => setEditVals(p => ({ ...p, building: e.target.value }))} style={IS}>
                  {(bldgs.length ? bldgs : ['—']).map(b => <option key={b} value={b} style={{ background: C.slate }}>{b}</option>)}
                </select>
                <input value={editVals.shift} onChange={e => setEditVals(p => ({ ...p, shift: e.target.value }))}
                  placeholder="e.g. Day (7:30am–4:00pm)" style={IS} />
                <select value={editVals.daysOff} onChange={e => setEditVals(p => ({ ...p, daysOff: e.target.value }))} style={IS}>
                  {DOFF.map(d => <option key={d} value={d} style={{ background: C.slate }}>{d}</option>)}
                </select>
                <select value={editVals.fte} onChange={e => setEditVals(p => ({ ...p, fte: e.target.value }))} style={IS}>
                  {['Full Time','Part Time','Casual'].map(ft => <option key={ft} value={ft} style={{ background: C.slate }}>{ft}</option>)}
                </select>
                <Btn small variant="gold" onClick={() => saveEdit(c.id)}>Save</Btn>
                <Btn small variant="sec"  onClick={() => setEditId(null)}>✕</Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <strong style={{ color: C.white, fontSize: 12, minWidth: 140 }}>{c.name}</strong>
                <span style={{ fontSize: 11, color: C.g2, minWidth: 130 }}>{c.building}</span>
                <Badge color={shiftColor(c.shift)}>{c.shift}</Badge>
                <span style={{ fontSize: 11, color: C.g2, marginLeft: 4 }}>{c.daysOff} off</span>
                <Badge color={C.g2}>{c.fte}</Badge>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <Btn small variant="sec" onClick={() => startEdit(c)}>✏ Edit</Btn>
                  <Btn small variant="danger" onClick={() => remove(c.id)}>✕</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
        {custs.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 10, color: C.g2 }}>
            Click <strong>✏ Edit</strong> to change shift times, building, or days off for any custodian.
          </div>
        )}
      </Card>
    </div>
  );
}
