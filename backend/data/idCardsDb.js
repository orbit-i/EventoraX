// data/idCardsDb.js
// PLACEHOLDER — same JSON-file pattern as certificatesDb.js.
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'idCardsDb.json');

function readAll() {
  if (!fs.existsSync(DB_PATH)) return [];
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}
function writeAll(records) {
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}
function saveIdCard(record) {
  const all = readAll();
  all.push(record);
  writeAll(all);
  return record;
}

module.exports = { saveIdCard, readAll };