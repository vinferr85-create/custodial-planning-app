import { useState, useEffect, useCallback } from 'react';
import { C } from './theme.js';
import api from './api.js';

import Dashboard       from './components/Dashboard.jsx';
import CleaningMatrix  from './components/CleaningMatrix.jsx';
import RoomInventory   from './components/RoomInventory.jsx';
import FTECalculator   from './components/FTECalculator.jsx';
import CustodianRoster from './components/CustodianRoster.jsx';
import Schedule        from './components/Schedule.jsx';
import WorkloadBalance from './components/WorkloadBalance.jsx';

const TABS = [
  { id: 'dash',    label: 'Dashboard',        icon: '📊' },
  { id: 'matrix',  label: 'Cleaning Matrix',  icon: '🧹' },
  { id: 'rooms',   label: 'Room Inventory',   icon: '🏢' },
  { id: 'fte',     label: 'FTE Calculator',   icon: '🧮' },
  { id: 'roster',  label: 'Custodian Roster', icon: '👷' },
  { id: 'sched',   label: '7-Day Schedule',   icon: '📅' },
  { id: 'balance', label: 'Workload Balance', icon: '⚖️'  },
];

export default function App() {
  const [tab,     setTab]     = useState('dash');
  const [rooms,   setRooms]   = useState([]);
  const [custs,   setCusts]   = useState([]);
  const [factors, setFactors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Load all data from backend on startup ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [r, c, f] = await Promise.all([api.getRooms(), api.getCustodians(), api.getFactors()]);
        setRooms(r);
        setCusts(c);
        setFactors(f);
      } catch (e) {
        setError('Could not connect to backend. Check your API URL and key in .env');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Room actions ───────────────────────────────────────────────────────
  const handleAddRoom = useCallback(async (room) => {
    try {
      const saved = await api.addRoom(room);
      setRooms(p => [...p, { ...room, id: saved.Id || room.id }]);
    } catch (e) { alert('Failed to save room: ' + e.message); }
  }, []);

  const handleDeleteRoom = useCallback(async (id) => {
    try {
      await api.deleteRoom(id);
      setRooms(p => p.filter(r => r.id !== id));
    } catch (e) { alert('Failed to delete room: ' + e.message); }
  }, []);

  const handleBulkAddRooms = useCallback(async (rows) => {
    try {
      await api.bulkAddRooms(rows);
      // Reload all rooms to get server-assigned IDs
      const fresh = await api.getRooms();
      setRooms(fresh);
    } catch (e) { alert('Bulk import failed: ' + e.message); }
  }, []);

  const handleToggleClean = useCallback(async (id) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const updated = { ...room, requiresCleaning: !room.requiresCleaning };
    try {
      await api.updateRoom(id, updated);
      setRooms(p => p.map(r => r.id === id ? updated : r));
    } catch (e) { alert('Failed to update room: ' + e.message); }
  }, [rooms]);

  // ── Custodian actions ──────────────────────────────────────────────────
  const handleAddCust = useCallback(async (cust) => {
    try {
      const saved = await api.addCustodian(cust);
      setCusts(p => [...p, { ...cust, id: saved.id || cust.id }]);
    } catch (e) { alert('Failed to save custodian: ' + e.message); }
  }, []);

  const handleDeleteCust = useCallback(async (id) => {
    try {
      await api.deleteCustodian(id);
      setCusts(p => p.filter(c => c.id !== id));
    } catch (e) { alert('Failed to delete custodian: ' + e.message); }
  }, []);

  const handleUpdateCust = useCallback(async (id, cust) => {
    try {
      await api.updateCustodian(id, cust);
      setCusts(p => p.map(c => c.id === id ? cust : c));
    } catch (e) { alert('Failed to update custodian: ' + e.message); }
  }, []);

  // ── Factor save ────────────────────────────────────────────────────────
  const handleSaveFactors = useCallback(async (newFactors) => {
    try { await api.updateFactors(newFactors); }
    catch (e) { console.warn('Could not save factors:', e.message); }
  }, []);

  // ── Loading / error states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>⟳</div>
        <div style={{ color: C.g2, fontSize: 14 }}>Connecting to backend…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: 32 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ color: C.red, fontSize: 14, textAlign: 'center', maxWidth: 480 }}>{error}</div>
        <div style={{ color: C.g2, fontSize: 12, textAlign: 'center' }}>
          Make sure your Azure Functions backend is running and<br />
          VITE_API_URL / VITE_API_KEY are set in your .env file.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{ width: 200, background: C.slate, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ffffff10', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #ffffff10' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, color: C.white, lineHeight: 1.25 }}>Custodial<br />Planning Suite</div>
          <div style={{ fontSize: 9, color: C.tealLt, marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ISSA 612 Standards</div>
        </div>
        <nav style={{ flex: 1, padding: '7px 5px', overflowY: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width: '100%', textAlign: 'left', padding: '8px 10px',
              background: tab === t.id ? C.teal + '33' : 'transparent',
              border: tab === t.id ? `1px solid ${C.teal}55` : '1px solid transparent',
              borderRadius: 7, color: tab === t.id ? C.white : C.g2,
              fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '8px 13px', borderTop: '1px solid #ffffff10', fontSize: 9, color: C.g3 }}>
          Saved to Azure SQL
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', background: C.navy }}>
        {tab === 'dash'    && <Dashboard       rooms={rooms}  custs={custs}   factors={factors} />}
        {tab === 'matrix'  && <CleaningMatrix  factors={factors} setFactors={setFactors} onSaveFactors={handleSaveFactors} />}
        {tab === 'rooms'   && <RoomInventory   rooms={rooms}  setRooms={setRooms}
                                onAdd={handleAddRoom} onDelete={handleDeleteRoom}
                                onBulkAdd={handleBulkAddRooms} onToggleClean={handleToggleClean} />}
        {tab === 'fte'     && <FTECalculator   rooms={rooms}  factors={factors} />}
        {tab === 'roster'  && <CustodianRoster custs={custs}  setCusts={setCusts} rooms={rooms}
                                onAdd={handleAddCust} onDelete={handleDeleteCust} onUpdate={handleUpdateCust} />}
        {tab === 'sched'   && <Schedule        rooms={rooms}  custs={custs} />}
        {tab === 'balance' && <WorkloadBalance  rooms={rooms}  custs={custs} />}
      </div>
    </div>
  );
}
