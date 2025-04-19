import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

// Shim __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// LowDB setup
const adapter = new JSONFile(path.join(__dirname, 'db.json'));
const db = new Low(adapter, { playlists: [] });
await db.read();

// Ensure data structure
if (!db.data) db.data = { playlists: [] };

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// API: Create or update playlist with custom slug from name
app.post('/api/playlists', async (req, res) => {
  try {
    const { name, urls } = req.body;
    if (!name || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Missing name or urls' });
    }
    // Slugify playlist name
    let slug = slugify(name, { lower: true, strict: true });
    // Avoid collisions
    if (db.data.playlists.find(p => p.id === slug)) {
      slug = `${slug}-${nanoid(4)}`;
    }
    db.data.playlists.push({ id: slug, name, urls });
    await db.write();
    res.json({ id: slug });
  } catch (err) {
    console.error('Error saving playlist:', err);
    res.status(500).json({ error: 'Failed to save playlist' });
  }
});

// API: Fetch playlist
app.get('/api/playlists/:id', (req, res) => {
  const entry = db.data.playlists.find(p => p.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  // Return name and urls
  res.json({ name: entry.name, urls: entry.urls });
});

// Viewer route
app.get('/playlist/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'playlist.html'));
});

// Fallback to builder UI
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
