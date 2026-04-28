import { useState } from 'react';
import { C, uid, SHIFTS, DOFF } from '../theme.js';
import { Card, Btn, Badge, Input, Select, PageHeader, DataGrid } from './UI.jsx';

export default function CustodianRoster({ custs, setCusts, rooms, onAdd, onDelete }) {
  const bldgs = [...new Set(rooms.map(r => r.building).filter(Boolean))];
  const [f, setF] = useState({ name: '', building: bldgs[0] || '', shift: SHIFTS[0], daysOff: DOFF[0], fte: 'Full Time' });
  const upd = k => v => setF(p => ({ ...p, [k]: v }));

  function add() {
    if (!f.name || !f.building) return;
    const cust = { ...f, id: uid() };
    onAdd ? onAdd(cust) : setCusts(p => [...p, cust]);
    setF(p => ({ ...p, name: '' }));
  }

  function remove(id) {
    onDelete ? onDelete(id) : setCusts(p => p.filter(x => x.id !== id));
  }

  return (
    <div>
      <PageHeader title="Custodian Roster" sub="Assign each custodian a primary building, shift, and days off." />

      <Card style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.tealLt, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Add Custodian</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7, marginBottom: 9 }}>
          <Input  label="Full Name" value={f.name}    onChange={upd('name')}    placeholder="Jane Smith" />
          <Select label="Building"  value={f.building} onChange={upd('building')} options={bldgs.length ? bldgs : ['—']} />
          <Select label="Shift"     value={f.shift}    onChange={upd('shift')}   options={SHIFTS} />
          <Select label="Days Off"  value={f.daysOff}  onChange={upd('daysOff')} options={DOFF} />
          <Select label="FTE Type"  value={f.fte}      onChange={upd('fte')}     options={['Full Time', 'Part Time', 'Casual']} />
        </div>
        <Btn onClick={add}>+ Add Custodian</Btn>
      </Card>

      <Card>
        <div style={{ fontSize: 12, color: C.g2, marginBottom: 9 }}>{custs.length} custodians rostered</div>
        <DataGrid
          cols={['2fr', '1.8fr', '1.5fr', '1fr', '0.8fr', '0.4fr']}
          headers={['Name', 'Building', 'Shift', 'Days Off', 'FTE', '']}
          empty="No custodians added yet."
          rows={custs.map(c => [
            <strong style={{ color: C.white, fontSize: 12 }}>{c.name}</strong>,
            c.building,
            <Badge color={c.shift.includes('Day') ? C.green : C.gold}>{c.shift}</Badge>,
            c.daysOff,
            <Badge color={C.g2}>{c.fte}</Badge>,
            <Btn small variant="danger" onClick={() => remove(c.id)}>✕</Btn>,
          ])}
        />
      </Card>
    </div>
  );
}
