// api.js — Talks to the Azure Functions backend.
// Set VITE_API_URL and VITE_API_KEY in your .env file.

const BASE = 'https://custodial-planning-api.onrender.com/api';
const KEY  = 'custodial-key-2024';

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (KEY) headers['x-functions-key'] = KEY;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const api = {
  getRooms:        (building) => request('GET',    building ? `/rooms?building=${encodeURIComponent(building)}` : '/rooms'),
  addRoom:         (room)     => request('POST',   '/rooms', room),
  updateRoom:      (id, room) => request('PUT',    `/rooms/${id}`, room),
  deleteRoom:      (id)       => request('DELETE', `/rooms/${id}`),
  bulkAddRooms:    (rooms)    => request('POST',   '/rooms/bulk', rooms),

  getCustodians:   ()         => request('GET',    '/custodians'),
  addCustodian:    (c)        => request('POST',   '/custodians', c),
  updateCustodian: (id, c)    => request('PUT',    `/custodians/${id}`, c),
  deleteCustodian: (id)       => request('DELETE', `/custodians/${id}`),

  getFactors:      ()         => request('GET',    '/factors'),
  updateFactors:   (map)      => request('PUT',    '/factors', map),
};

export default api;
