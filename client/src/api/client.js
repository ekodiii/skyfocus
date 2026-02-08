// API client for backend communication

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchAirports(search = '', limit = 100, offset = 0) {
  const params = new URLSearchParams({ limit, offset });
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE}/airports?${params}`);
  if (!response.ok) throw new Error('Failed to fetch airports');
  return response.json();
}

export async function fetchAirport(icao) {
  const response = await fetch(`${API_BASE}/airports/${icao}`);
  if (!response.ok) throw new Error('Airport not found');
  return response.json();
}

export async function fetchRoutes(icao) {
  const response = await fetch(`${API_BASE}/routes/${icao}`);
  if (!response.ok) throw new Error('No routes found');
  return response.json();
}

export async function fetchRoutesForDuration(icao, durationMinutes) {
  const response = await fetch(`${API_BASE}/routes/${icao}/${durationMinutes}`);
  if (!response.ok) throw new Error('No matching routes found');
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}
