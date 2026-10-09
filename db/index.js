const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'leads.sqlite');
let db;

const STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'closed'];

function initDb() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      email       TEXT,
      town        TEXT,
      service     TEXT,
      urgency     TEXT,
      last_pumped TEXT,
      message     TEXT,
      status      TEXT NOT NULL DEFAULT 'new',
      notes       TEXT,
      updated_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
  `);
  return db;
}

function getDb() {
  if (!db) initDb();
  return db;
}

function createLead(lead) {
  const stmt = getDb().prepare(`
    INSERT INTO leads (name, phone, email, town, service, urgency, last_pumped, message)
    VALUES (@name, @phone, @email, @town, @service, @urgency, @last_pumped, @message)
  `);
  const info = stmt.run(lead);
  return getLead(info.lastInsertRowid);
}

function getLead(id) {
  return getDb().prepare('SELECT * FROM leads WHERE id = ?').get(id);
}

function listLeads({ status } = {}) {
  if (status && STATUSES.includes(status)) {
    return getDb().prepare('SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return getDb().prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
}

function updateLead(id, { status, notes }) {
  const current = getLead(id);
  if (!current) return null;
  const nextStatus = STATUSES.includes(status) ? status : current.status;
  const nextNotes = typeof notes === 'string' ? notes.slice(0, 4000) : current.notes;
  getDb().prepare(`UPDATE leads SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(nextStatus, nextNotes, id);
  return getLead(id);
}

function deleteLead(id) {
  return getDb().prepare('DELETE FROM leads WHERE id = ?').run(id).changes > 0;
}

function stats() {
  const rows = getDb().prepare('SELECT status, COUNT(*) AS n FROM leads GROUP BY status').all();
  const out = Object.fromEntries(STATUSES.map(s => [s, 0]));
  rows.forEach(r => { out[r.status] = r.n; });
  out.total = rows.reduce((a, r) => a + r.n, 0);
  out.emergency_open = getDb().prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE urgency = 'emergency' AND status IN ('new','contacted')`
  ).get().n;
  return out;
}

module.exports = { initDb, getDb, createLead, getLead, listLeads, updateLead, deleteLead, stats, STATUSES };
