import https from 'https';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

// Data source URLs
const SOURCES = {
  airports: 'https://davidmegginson.github.io/ourairports-data/airports.csv',
  runways: 'https://davidmegginson.github.io/ourairports-data/runways.csv',
  countries: 'https://davidmegginson.github.io/ourairports-data/countries.csv',
  routes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
};

// Average cruise speed for jets (knots)
const CRUISE_SPEED_KNOTS = 500;

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in nautical miles
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Download file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded to ${filepath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Parse CSV file
function parseCSV(filepath, columns = true) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({
      columns: columns,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true
    });

    fs.createReadStream(filepath)
      .pipe(parser)
      .on('data', (record) => records.push(record))
      .on('end', () => resolve(records))
      .on('error', (err) => reject(err));
  });
}

// Process airports
async function processAirports() {
  console.log('\nProcessing airports...');
  const airports = await parseCSV(path.join(RAW_DIR, 'airports.csv'));

  // Filter for large/medium airports with scheduled service
  const filtered = airports.filter(a =>
    (a.type === 'large_airport' || a.type === 'medium_airport') &&
    a.scheduled_service === 'yes' &&
    a.iata_code && a.iata_code.length === 3 &&
    a.latitude_deg && a.longitude_deg
  );

  // Create indexed structure
  const processed = {};
  filtered.forEach(a => {
    const icao = a.ident;
    processed[icao] = {
      icao: icao,
      iata: a.iata_code,
      name: a.name,
      city: a.municipality || '',
      country: a.iso_country,
      lat: parseFloat(a.latitude_deg),
      lon: parseFloat(a.longitude_deg),
      elevation: parseInt(a.elevation_ft) || 0,
      type: a.type
    };
  });

  console.log(`Processed ${Object.keys(processed).length} airports`);
  return processed;
}

// Process runways
async function processRunways() {
  console.log('\nProcessing runways...');
  const runways = await parseCSV(path.join(RAW_DIR, 'runways.csv'));

  // Filter for open runways with heading data
  const filtered = runways.filter(r =>
    r.closed !== '1' &&
    r.le_heading_degT &&
    r.he_heading_degT &&
    r.length_ft
  );

  // Index by airport
  const processed = {};
  filtered.forEach(r => {
    const icao = r.airport_ident;
    if (!processed[icao]) {
      processed[icao] = [];
    }

    processed[icao].push({
      id: r.le_ident,
      heading: parseFloat(r.le_heading_degT),
      reciprocal_id: r.he_ident,
      reciprocal_heading: parseFloat(r.he_heading_degT),
      length: parseInt(r.length_ft),
      width: parseInt(r.width_ft) || 0,
      surface: r.surface,
      le_lat: parseFloat(r.le_latitude_deg),
      le_lon: parseFloat(r.le_longitude_deg),
      he_lat: parseFloat(r.he_latitude_deg),
      he_lon: parseFloat(r.he_longitude_deg)
    });
  });

  console.log(`Processed runways for ${Object.keys(processed).length} airports`);
  return processed;
}

// Process routes
async function processRoutes(airports) {
  console.log('\nProcessing routes...');
  const routesFile = path.join(RAW_DIR, 'routes.dat');
  const routes = await parseCSV(routesFile, false); // routes.dat has no header

  // Build IATA to ICAO lookup
  const iataToIcao = {};
  Object.values(airports).forEach(a => {
    iataToIcao[a.iata] = a.icao;
  });

  // Process routes
  const processed = {};
  const routeSet = new Set(); // Avoid duplicates

  routes.forEach(r => {
    const stops = parseInt(r[7]) || 0;
    if (stops !== 0) return; // Only direct flights

    let srcCode = r[2];
    let dstCode = r[4];

    // Convert IATA to ICAO if needed
    if (srcCode.length === 3) srcCode = iataToIcao[srcCode];
    if (dstCode.length === 3) dstCode = iataToIcao[dstCode];

    if (!srcCode || !dstCode) return;
    if (!airports[srcCode] || !airports[dstCode]) return;

    // Create unique route key (bidirectional, so sort alphabetically)
    const routeKey = [srcCode, dstCode].sort().join('-');
    if (routeSet.has(routeKey)) return;
    routeSet.add(routeKey);

    const src = airports[srcCode];
    const dst = airports[dstCode];

    // Calculate distance and flight time
    const distance = calculateDistance(src.lat, src.lon, dst.lat, dst.lon);
    const cruiseTime = (distance / CRUISE_SPEED_KNOTS) * 60; // minutes
    const climbDescendTime = 20; // approximate climb + descent time
    const totalTime = Math.round(cruiseTime + climbDescendTime);

    // Store both directions
    if (!processed[srcCode]) processed[srcCode] = [];
    if (!processed[dstCode]) processed[dstCode] = [];

    processed[srcCode].push({
      from: srcCode,
      to: dstCode,
      distance: Math.round(distance),
      time: totalTime
    });

    processed[dstCode].push({
      from: dstCode,
      to: srcCode,
      distance: Math.round(distance),
      time: totalTime
    });
  });

  console.log(`Processed ${routeSet.size} unique routes`);
  return processed;
}

// Main processing function
async function main() {
  try {
    // Ensure directories exist
    fs.mkdirSync(RAW_DIR, { recursive: true });
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });

    // Download raw data
    console.log('Downloading data files...');
    await downloadFile(SOURCES.airports, path.join(RAW_DIR, 'airports.csv'));
    await downloadFile(SOURCES.runways, path.join(RAW_DIR, 'runways.csv'));
    await downloadFile(SOURCES.routes, path.join(RAW_DIR, 'routes.dat'));

    // Process data
    const airports = await processAirports();
    const runways = await processRunways();
    const routes = await processRoutes(airports);

    // Write processed data
    console.log('\nWriting processed data...');
    fs.writeFileSync(
      path.join(PROCESSED_DIR, 'airports.json'),
      JSON.stringify(airports, null, 2)
    );

    fs.writeFileSync(
      path.join(PROCESSED_DIR, 'runways.json'),
      JSON.stringify(runways, null, 2)
    );

    fs.writeFileSync(
      path.join(PROCESSED_DIR, 'routes.json'),
      JSON.stringify(routes, null, 2)
    );

    console.log('\nData processing complete!');
    console.log(`- ${Object.keys(airports).length} airports`);
    console.log(`- ${Object.keys(runways).length} airports with runways`);
    console.log(`- ${Object.keys(routes).length} airports with routes`);

  } catch (error) {
    console.error('Error processing data:', error);
    process.exit(1);
  }
}

main();
