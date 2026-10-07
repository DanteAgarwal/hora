const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const app = express()
const port = process.env.PORT || 4000
const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'kundli-workbench.db')

fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)

const sampleChart = {
  id: 1,
  name: 'Akshat',
  date: '15 March 2000',
  time: '14:32',
  location: 'Agra, India',
  latitude: '27.1767° N',
  longitude: '78.0081° E',
  timezone: 'IST (+5:30)',
  lagna: 'Leo 2°17\'',
  moon: 'Libra 9°34\'',
  currentMahadasha: 'Saturn • 2019–2038',
  source: 'Hora API / SQLite adapter',
  planets: [
    { name: 'Saturn', sign: 'Taurus', degree: '6°50\'', nakshatra: 'Rohini • Pada 1', house: '11th', retrograde: false, status: 'Strong in 11th' },
    { name: 'Moon', sign: 'Libra', degree: '9°34\'', nakshatra: 'Swati • Pada 2', house: '4th', retrograde: false, status: 'Mind and emotional balance' },
    { name: 'Sun', sign: 'Pisces', degree: '25°12\'', nakshatra: 'Revati • Pada 2', house: '10th', retrograde: false, status: 'Career orientation' },
    { name: 'Mars', sign: 'Gemini', degree: '14°52\'', nakshatra: 'Mrigashira • Pada 3', house: '3rd', retrograde: false, status: 'Action and courage' },
    { name: 'Mercury', sign: 'Pisces', degree: '11°44\'', nakshatra: 'Revati • Pada 1', house: '10th', retrograde: true, status: 'Speech and analysis' },
    { name: 'Venus', sign: 'Aquarius', degree: '13°58\'', nakshatra: 'Shatabhisha • Pada 2', house: '8th', retrograde: false, status: 'Values and relationships' },
    { name: 'Jupiter', sign: 'Cancer', degree: '8°21\'', nakshatra: 'Punarvasu • Pada 2', house: '5th', retrograde: false, status: 'Wisdom and education' },
    { name: 'Rahu', sign: 'Virgo', degree: '29°42\'', nakshatra: 'Chitra • Pada 1', house: '12th', retrograde: false, status: 'Karmic pressure' },
    { name: 'Ketu', sign: 'Pisces', degree: '29°42\'', nakshatra: 'Revati • Pada 3', house: '6th', retrograde: false, status: 'Spiritual detachment' },
  ],
  houses: [
    { name: '1st House', sign: 'Leo', lord: 'Sun', occupants: ['Ascendant'] },
    { name: '2nd House', sign: 'Virgo', lord: 'Mercury', occupants: ['Mercury'] },
    { name: '3rd House', sign: 'Libra', lord: 'Venus', occupants: ['Mars'] },
    { name: '4th House', sign: 'Scorpio', lord: 'Mars', occupants: ['Moon'] },
    { name: '5th House', sign: 'Sagittarius', lord: 'Jupiter', occupants: ['Jupiter'] },
    { name: '6th House', sign: 'Capricorn', lord: 'Saturn', occupants: ['Rahu'] },
    { name: '7th House', sign: 'Aquarius', lord: 'Saturn', occupants: ['Venus'] },
    { name: '8th House', sign: 'Pisces', lord: 'Jupiter', occupants: ['Ketu'] },
    { name: '9th House', sign: 'Aries', lord: 'Mars', occupants: [] },
    { name: '10th House', sign: 'Taurus', lord: 'Venus', occupants: ['Sun', 'Mercury'] },
    { name: '11th House', sign: 'Gemini', lord: 'Mercury', occupants: ['Saturn'] },
    { name: '12th House', sign: 'Cancer', lord: 'Moon', occupants: [] },
  ],
  vargas: [
    { code: 'D1', title: 'Rashi', purpose: 'Birth chart', status: 'Available' },
    { code: 'D9', title: 'Navamsha', purpose: 'Dharma, marriage, karma', status: 'Available' },
    { code: 'D10', title: 'Dashamsha', purpose: 'Career and authority', status: 'Available' },
    { code: 'D12', title: 'Dwadasamsha', purpose: 'Parentage and values', status: 'Available' },
    { code: 'D60', title: 'Shashtiamsa', purpose: 'Deep analysis', status: 'Preview' },
  ],
  dashas: [
    { period: 'Saturn', label: 'Mahadasha', start: '2019', end: '2038', color: '#c9a66b' },
    { period: 'Mercury', label: 'Antardasha', start: '2023', end: '2025', color: '#7ec8c9' },
    { period: 'Ketu', label: 'Pratyantardasha', start: '2024', end: '2024', color: '#ed9e7a' },
  ],
}

const existing = db.prepare('SELECT COUNT(*) AS count FROM charts').get()
if (!existing.count) {
  db.prepare('INSERT INTO charts (name, payload) VALUES (?, ?)').run(sampleChart.name, JSON.stringify(sampleChart))
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: dbPath })
})

app.get('/api/charts', (_req, res) => {
  const rows = db.prepare('SELECT id, name, payload FROM charts ORDER BY created_at DESC').all()
  const charts = rows.map((row) => ({
    ...JSON.parse(row.payload),
    id: row.id,
    name: row.name,
  }))
  res.json(charts)
})

app.get('/api/charts/:id', (req, res) => {
  const row = db.prepare('SELECT id, name, payload FROM charts WHERE id = ?').get(req.params.id)
  if (!row) {
    return res.status(404).json({ error: 'Chart not found' })
  }

  return res.json({
    ...JSON.parse(row.payload),
    id: row.id,
    name: row.name,
  })
})

app.post('/api/charts', (req, res) => {
  const payload = req.body
  if (!payload || !payload.name) {
    return res.status(400).json({ error: 'Chart name is required' })
  }

  const safeChart = {
    ...sampleChart,
    ...payload,
    id: Date.now(),
  }

  const statement = db.prepare('INSERT INTO charts (name, payload) VALUES (?, ?)')
  const result = statement.run(safeChart.name, JSON.stringify(safeChart))

  return res.status(201).json({
    ...safeChart,
    id: result.lastInsertRowid,
  })
})

app.listen(port, () => {
  console.log(`Kundli Workbench API running on http://localhost:${port}`)
})
