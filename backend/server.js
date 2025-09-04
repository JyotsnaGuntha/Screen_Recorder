require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = process.env.DB_FILE || 'database.db';

// --- Middleware ---
app.use(cors({
  origin: [
    "https://screen-recorder-teal.vercel.app", // production
    /\.vercel\.app$/                           // all preview deployments
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// --- Database ---
const db = new sqlite3.Database(path.join(__dirname, DB_FILE), (err) => {
  if (err) console.error("❌ DB connection failed:", err.message);
  else console.log(`✅ Connected to database: ${DB_FILE}`);
});

db.run(`CREATE TABLE IF NOT EXISTS recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  filename TEXT,
  filepath TEXT,
  filesize INTEGER,
  createdAt DATETIME DEFAULT (datetime('now', 'localtime'))
)`);

// --- Multer config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.webm');
  }
});
const upload = multer({ storage });

// --- Routes ---
app.post('/api/recordings', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please upload a file.' });

  const { originalname, size, filename } = req.file;
  const filepath = `uploads/${filename}`;

  const sql = `INSERT INTO recordings (title, filename, filepath, filesize) VALUES (?, ?, ?, ?)`;
  db.run(sql, [`Recording-${Date.now()}`, originalname, filepath, size], function(err) {
    if (err) {
      console.error("❌ DB insert error:", err.message);
      return res.status(500).json({ message: 'Error saving to database.', error: err.message });
    }
    res.status(201).json({ message: 'Recording uploaded successfully', recordingId: this.lastID });
  });
});

app.get('/api/recordings', (req, res) => {
  db.all(`SELECT * FROM recordings ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching recordings.', error: err.message });
    res.status(200).json(rows);
  });
});

app.put('/api/recordings/:id', (req, res) => {
  const { title } = req.body;
  const { id } = req.params;
  if (!title) return res.status(400).json({ message: 'Title is required.' });

  db.run(`UPDATE recordings SET title = ? WHERE id = ?`, [title, id], function(err) {
    if (err) return res.status(500).json({ message: 'Error updating title.', error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Recording not found.' });
    res.status(200).json({ message: 'Title updated successfully.' });
  });
});

app.delete('/api/recordings/:id', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT filepath FROM recordings WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
    if (!row) return res.status(404).json({ message: 'Recording not found.' });

    const fullPath = path.join(__dirname, row.filepath);
    fs.unlink(fullPath, (unlinkErr) => {
      if (unlinkErr) console.error("⚠️ File delete error:", unlinkErr);

      db.run(`DELETE FROM recordings WHERE id = ?`, id, function(dbErr) {
        if (dbErr) return res.status(500).json({ message: 'Error deleting record.', error: dbErr.message });
        res.status(200).json({ message: 'Recording deleted successfully.' });
      });
    });
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
