import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load processed data
const DATA_DIR = path.join(__dirname, '../data/processed');
let airports, runways, routes;

function loadData() {
  try {
    airports = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'airports.json'), 'utf8'));
    runways = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'runways.json'), 'utf8'));
    routes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'routes.json'), 'utf8'));
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Error loading data:', error.message);
    console.log('Please run: npm run process-data');
  }
}

loadData();

// GET /api/airports - List all airports (with optional search)
router.get('/airports', (req, res) => {
  if (!airports) {
    return res.status(503).json({ error: 'Data not loaded. Run npm run process-data' });
  }

  const { search, limit = 100, offset = 0 } = req.query;
  let results = Object.values(airports);

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    results = results.filter(a =>
      a.name.toLowerCase().includes(searchLower) ||
      a.city.toLowerCase().includes(searchLower) ||
      a.iata.toLowerCase().includes(searchLower) ||
      a.icao.toLowerCase().includes(searchLower)
    );
  }

  // Sort by type (large first) then by name
  results.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'large_airport' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Pagination
  const total = results.length;
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);
  results = results.slice(offsetNum, offsetNum + limitNum);

  res.json({
    airports: results,
    total,
    limit: limitNum,
    offset: offsetNum
  });
});

// GET /api/airports/:icao - Get single airport with runways
router.get('/airports/:icao', (req, res) => {
  if (!airports || !runways) {
    return res.status(503).json({ error: 'Data not loaded' });
  }

  const { icao } = req.params;
  const airport = airports[icao.toUpperCase()];

  if (!airport) {
    return res.status(404).json({ error: 'Airport not found' });
  }

  res.json({
    ...airport,
    runways: runways[icao.toUpperCase()] || []
  });
});

// GET /api/routes/:icao - Get all routes from an airport
router.get('/routes/:icao', (req, res) => {
  if (!routes || !airports) {
    return res.status(503).json({ error: 'Data not loaded' });
  }

  const { icao } = req.params;
  const airportRoutes = routes[icao.toUpperCase()];

  if (!airportRoutes) {
    return res.status(404).json({ error: 'No routes found for this airport' });
  }

  // Enrich with destination info
  const enriched = airportRoutes.map(r => ({
    ...r,
    destination: airports[r.to]
  }));

  res.json(enriched);
});

// GET /api/routes/:icao/:time - Get routes matching target time (±10 min)
router.get('/routes/:icao/:time', (req, res) => {
  if (!routes || !airports) {
    return res.status(503).json({ error: 'Data not loaded' });
  }

  const { icao, time } = req.params;
  const targetTime = parseInt(time);
  const tolerance = 10; // minutes

  const airportRoutes = routes[icao.toUpperCase()];

  if (!airportRoutes) {
    return res.status(404).json({ error: 'No routes found for this airport' });
  }

  // Filter by time window
  const matched = airportRoutes.filter(r =>
    Math.abs(r.time - targetTime) <= tolerance
  );

  // Enrich with destination info and sort by time difference
  const enriched = matched
    .map(r => ({
      ...r,
      destination: airports[r.to],
      timeDiff: Math.abs(r.time - targetTime)
    }))
    .sort((a, b) => a.timeDiff - b.timeDiff);

  res.json(enriched);
});

// GET /api/health - Health check
router.get('/health', (req, res) => {
  const dataLoaded = !!(airports && runways && routes);
  res.json({
    status: dataLoaded ? 'ok' : 'data not loaded',
    airports: airports ? Object.keys(airports).length : 0,
    runways: runways ? Object.keys(runways).length : 0,
    routeOrigins: routes ? Object.keys(routes).length : 0
  });
});

// Proxy Mapbox Satellite
router.get('/map/satellite/:z/:x/:y', async (req, res) => {
  const { z, x, y } = req.params;

  if (!MAPBOX_TOKEN) {
    console.error('MAPBOX_TOKEN missing');
    return res.status(500).send('Server configuration error');
  }

  const url = `https://api.mapbox.com/v4/mapbox.satellite/${z}/${x}/${y}@2x.jpg90?access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Mapbox error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send('Mapbox error');
    }

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Error fetching tile');
  }
});

// Proxy Mapbox Satellite Streets
router.get('/map/satellite-streets/:z/:x/:y', async (req, res) => {
  const { z, x, y } = req.params;

  if (!MAPBOX_TOKEN) {
    return res.status(500).send('Server configuration error');
  }

  const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/${z}/${x}/${y}@2x?access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send('Mapbox error');
    }

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Error fetching tile');
  }
});

export default router;
