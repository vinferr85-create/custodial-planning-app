import { useState } from 'react';
import { C, uid, SHIFTS, DOFF } from '../theme.js';
import { Card, Btn, Badge, Input, Select, PageHeader, DataGrid } from './UI.jsx';

// Derive shift colour and label from shift string
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
  const [editId, setEditId] = useState(null);   // which custodian is being edited
  const [editVals, setEditVals] = useState({});  // values being edited
  const upd = k => v => setF(p => ({ ...p, [k]: v }));

  // Default shift time from the selected shift name
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

  const IS = { background: '#ffffff0d', border: '1px solid #ffffff22', borderRadius: 7, padding: '6px 8px', color: C.off, fontSize: 12, outline: 'none', width: '100%' };
  const LBL = { fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div>
      <PageHeader title="Custodian Roster" sub="Assign each custodian a building, shift, and days off. Shift times can be customised per person." />

      {/* Add form */}
      <Card style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.tealLt, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Add Custodian</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.8fr 1fr 0.9fr', gap: 7, marginBottom: 8 }}>
          <Input  label="Full Name"  value={f.name}     onChange={upd('name')}     placeholder="Jane Smith" />
          <Select label="Building"   value={f.building}  onChange={upd('building')} options={bldgs.length ? bldgs : ['—']} />
          <Select label="Shift"      value={f.shift}     onChange={v => { upd('shift')(v); upd('customTime')(''); }} options={SHIFTS} />
          <Select label="Days Off"   value={f.daysOff}   onChange={upd('daysOff')}  options={DOFF} />
          <Select label="FTE Type"   value={f.fte}       onChange={upd('fte')}      options={['Full Time', 'Part Time', 'Casual']} />
        </div>
        {/* Custom time override */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 7, marginBottom: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ ...LBL, marginBottom: 3 }}>Custom Shift Time (optional)</div>
            <div style={{ fontSize: 10, color: C.g2, marginBottom: 4 }}>Override the standard time for this person — e.g. <em>7:30am–4:00pm</em></div>
            <input value={f.customTime} onChange={e => upd('customTime')(e.target.value)}
              placeholder={`Default: ${defaultTime(f.shift)}`}
              style={IS} />
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

      {/* Roster table */}
      <Card>
        <div style={{ fontSize: 12, color: C.g2, marginBottom: 9 }}>{custs.length} custodians rostered</div>
        {custs.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.g2, fontSize: 13 }}>No custodians added yet.</div>}
        {custs.map((c, i) => (
          <div key={c.id} style={{ background: i % 2 === 0 ? '#ffffff05' : 'transparent', borderBottom: '1px solid #ffffff08', padding: '8px 10px' }}>
            {editId === c.id ? (
              /* Edit mode */
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
                  {['Full Time','Part Time','Casual'].map(f => <option key={f} value={f} style={{ background: C.slate }}>{f}</option>)}
                </select>
                <Btn small variant="gold" onClick={() => saveEdit(c.id)}>Save</Btn>
                <Btn small variant="sec"  onClick={() => setEditId(null)}>✕</Btn>
              </div>
            ) : (
              /* View mode */
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
