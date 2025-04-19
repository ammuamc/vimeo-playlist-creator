📄 README.md
markdown
Copy
Edit
# 🎬 Vimeo Playlist Creator

Build and share custom Vimeo playlists with a clean, responsive UI and persistent storage. Designed for creators, agencies, and teams who want to showcase or organize Vimeo videos in a visual and dynamic format.

---

## 🚀 Live Demo

> Coming Soon: [your-deployment-link]

---

## 📦 Features

✅ Drag-and-drop playlist builder  
✅ Thumbnail previews from Vimeo  
✅ Save and generate shareable playlist URLs  
✅ Mobile-friendly responsive layout  
✅ Smooth horizontal scrolling in both builder and viewer  
✅ Viewer mode for clean, client-facing playback

---

## 🖼️ Screenshots

| Builder Page | Viewer Page |
|--------------|-------------|
| ![Builder](public/images/screenshot-builder.png) | ![Viewer](public/images/screenshot-viewer.png) |

---

## 🧰 Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3 (Flexbox + CSS Variables)
- **Backend:** Node.js + Express + LowDB (JSON file database)
- **Other:** Sortable.js (drag-and-drop), Vimeo Player API, ResizeObserver for layout

---

## 🛠️ Getting Started

Clone the repo:

```bash
git clone https://github.com/ammuamc/vimeo-playlist-creator.git
cd vimeo-playlist-creator
npm install
npm run dev
The server will start at:
👉 http://localhost:3000

🧪 Usage Guide
▶️ Playlist Viewer
Navigate to:

bash
Copy
Edit
/playlist/:id
Example:

bash
Copy
Edit
http://localhost:3000/playlist/amaze
✍️ Playlist Builder
Visit the root:

arduino
Copy
Edit
http://localhost:3000/
Steps:

Paste Vimeo video URLs (one per line)

Click Load Videos

Drag to reorder thumbnails

Click Save Playlist

Share the generated URL!

📁 Folder Structure
pgsql
Copy
Edit
vimeo-playlist-server/
├── public/
│   ├── builder.js
│   ├── viewer.js
│   ├── index.html
│   ├── playlist.html
│   └── style.css
├── server.js
├── db.json
├── package.json
🌍 Deployment Tips
You can deploy the full project using:

Render / Railway / Fly.io for Node + frontend

Vercel (frontend-only, but backend will not work unless hosted separately)

🧑‍💻 Credits
Built with ❤️ by the Ammunition Team
Project maintained by: @jon.hayes

📄 License
MIT — free to use, modify, and share.

yaml
Copy
Edit

---

## ✅ Next Step

Drop that into a file called `README.md` in your root directory:

```bash
notepad README.md
Paste it, save it, then run:

bash
Copy
Edit
git add README.md
git commit -m "Added project README"
git push origin master