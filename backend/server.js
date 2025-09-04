const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware for CORS, parsing JSON, and serving uploaded video files.
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to the database file and ensure the 'recordings' table exists.
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    filename TEXT,
    filepath TEXT,
    filesize INTEGER,
    createdAt DATETIME DEFAULT (datetime('now', 'localtime'))
)`, (err) => {
    if (err) console.error("Error creating table", err.message);
});

// Configure Multer to save uploaded files with a unique name in the './uploads' directory.
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.webm');
    }
});
const upload = multer({ storage: storage });


app.post('/api/recordings', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send({ message: 'Please upload a file.' });

    const { originalname, size } = req.file;
    // Normalize Windows-style backslashes to URL-friendly forward slashes.
    const filepath = req.file.path.replace(/\\/g, '/');

    const sql = `INSERT INTO recordings (title, filename, filepath, filesize) VALUES (?, ?, ?, ?)`;
    db.run(sql, [`Recording-${Date.now()}`, originalname, filepath, size], function(err) {
        if (err) return res.status(500).send({ message: 'Error saving to database.', error: err.message });
        res.status(201).send({ message: 'Recording uploaded successfully', recordingId: this.lastID });
    });
});

app.get('/api/recordings', (req, res) => {
    db.all(`SELECT * FROM recordings ORDER BY createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).send({ message: 'Error fetching recordings.', error: err.message });
        res.status(200).json(rows);
    });
});

app.put('/api/recordings/:id', (req, res) => {
    const { title } = req.body;
    const { id } = req.params;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    const sql = `UPDATE recordings SET title = ? WHERE id = ?`;
    db.run(sql, [title, id], function(err) {
        if (err) return res.status(500).json({ message: 'Error updating title.', error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Recording not found.' });
        res.status(200).json({ message: 'Title updated successfully.' });
    });
});

app.delete('/api/recordings/:id', (req, res) => {
    const { id } = req.params;

    // First, get the file path to delete the physical file from storage.
    db.get(`SELECT filepath FROM recordings WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err.message });
        if (!row) return res.status(404).json({ message: 'Recording not found.' });
        
        fs.unlink(row.filepath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file:", unlinkErr);

            // After deleting the file, remove its record from the database.
            db.run(`DELETE FROM recordings WHERE id = ?`, id, function(dbErr) {
                if (dbErr) return res.status(500).json({ message: 'Error deleting record.', error: dbErr.message });
                res.status(200).json({ message: 'Recording deleted successfully.' });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});