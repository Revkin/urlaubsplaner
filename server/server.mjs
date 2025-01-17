// server.mjs
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// SQLite Datenbankverbindung
let db;
const initializeDb = async () => {
  db = await open({
    filename: new URL('./holiday_planner.db', import.meta.url).pathname,
    driver: sqlite3.Database
  });

  // Tabellen erstellen
  await db.exec(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      data TEXT
    );
    
    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
  `);
};

initializeDb().catch(console.error);

// API Endpunkte
app.get('/api/responses', async (req, res) => {
  try {
    const responses = await db.all('SELECT * FROM responses');
    res.json(responses.map(r => ({ ...r, data: JSON.parse(r.data) })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/responses', async (req, res) => {
  try {
    const { name, ...data } = req.body;
    
    // Ensure availablePeriods exists and is an array
    if (!data.availablePeriods || !Array.isArray(data.availablePeriods)) {
      data.availablePeriods = [];
    }
    
    // Validate each period
    data.availablePeriods = data.availablePeriods.map(period => ({
      startDate: period.startDate || '',
      endDate: period.endDate || ''
    }));
    
    await db.run(
      'INSERT INTO responses (name, data) VALUES (?, ?)',
      name,
      JSON.stringify(data)
    );
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/destinations', async (req, res) => {
  try {
    const { search } = req.query;
    let destinations;
    
    if (search) {
      destinations = await db.all(
        'SELECT * FROM destinations WHERE name LIKE ?',
        `%${search}%`
      );
    } else {
      destinations = await db.all('SELECT * FROM destinations');
    }
    
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
