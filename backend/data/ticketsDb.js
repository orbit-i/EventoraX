// data/ticketsDb.js
// PLACEHOLDER — same JSON-file pattern as certificatesDb.js.
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'ticketsDb.json');

function readAll() {
  if (!fs.existsSync(DB_PATH)) return [];
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}
function writeAll(records) {
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}
function saveTicket(record) {
  const all = readAll();
  all.push(record);
  writeAll(all);
  return record;
}
function findByTicketCode(ticketCode) {
  const all = readAll();
  return all.find((t) => t.ticketCode === ticketCode) || null;
}
function updateTicket(id, updates) {
  const all = readAll();
  const index = all.findIndex((t) => t.id === id);
  if (index === -1) return null;
  all[index] = { ...all[index], ...updates };
  writeAll(all);
  return all[index];
}

module.exports = { saveTicket, readAll, findByTicketCode, updateTicket };