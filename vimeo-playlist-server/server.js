// server.js
// Express server with lowdb JSON "database" and slug‑based playlist IDs

const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const slugify = require('slugify');
const { nanoid } = require('nanoid');
const { join } = require('path');

// --- lowdb setup ---
const dbFile = join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = { playlists: {} };
const db = new Low(adapter, defaultData);

async function initDB() {
  await db.read();
  // ensure default structure
  db.data ||= defaultData;
  await db.write();
}

// --- Express setup ---
const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(join(__dirname, 'public')));

// Create a new playlist (POST /api/playlists)
app.post('/api/playlists', async (req, res) => {
  const { name, urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls must be a non-empty array' });
  }

  // Generate a URL‑safe slug from the name
  let slug = slugify(name, { lower: true, strict: true });
  if (!slug) slug = nanoid(4);
  // Avoid collisions by appending a short nanoid if needed
  if (db.data.playlists[slug]) {
    slug = `${slug}-${nanoid(4)}`;
  }

  // Persist playlist under that slug
  db.data.playlists[slug] = { name, urls };
  await db.write();

  // Return the slug as the playlist ID
  res.json({ id: slug });
});

// Retrieve a playlist by ID (GET /api/playlists/:id)
app.get('/api/playlists/:id', async (req, res) => {
  const playlist = db.data.playlists[req.params.id];
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  res.json({ id: req.params.id, ...playlist });
});

// Start the server after initializing DB
initDB().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
});
