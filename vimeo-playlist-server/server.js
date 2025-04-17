// server.js
const express = require('express');
const cors    = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid }   = require('nanoid');
const { join }     = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1) Tell lowdb your defaults up‑front:
const adapter = new JSONFile(join(__dirname, 'db.json'));
const db      = new Low(adapter, { playlists: {} });   // ← defaultData passed here!

// 2) Initialize (read existing or write defaults)
async function initDB() {
  await db.read();    // if db.json doesn’t exist or is empty, db.data === undefined
  await db.write();   // writes { playlists: {} } back out
}

// 3) Serve your frontend
app.use(express.static(join(__dirname, 'public')));

// 4) Save a playlist
app.post('/api/playlists', async (req, res) => {
  const { name, urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls must be a non-empty array' });
  }
  const id = nanoid(8);
  db.data.playlists[id] = { name, urls };
  await db.write();
  res.json({ id });
});

// 5) Load a playlist
app.get('/api/playlists/:id', async (req, res) => {
  const p = db.data.playlists[req.params.id];
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ id: req.params.id, ...p });
});

// 6) Start the server
initDB().then(() => {
  app.listen(3000, () => console.log('Server running on http://localhost:3000'));
});
