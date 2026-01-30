// tileUtils.js
// Utilities for calculating map tile coordinates (Web Mercator)

// Mapbox access token from environment (No longer needed on client)
// const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const TILE_PROVIDERS = {
    // Mapbox Satellite - Highest quality, runway-level detail
    MAPBOX_SATELLITE: {
        url: (x, y, z) => `/api/map/satellite/${z}/${x}/${y}`,
        attribution: '© Mapbox © OpenStreetMap'
    },
    // Mapbox Satellite Streets - Satellite with labels
    MAPBOX_SATELLITE_STREETS: {
        url: (x, y, z) => `/api/map/satellite-streets/${z}/${x}/${y}`,
        attribution: '© Mapbox © OpenStreetMap'
    },
    // ArcGIS World Imagery (Satellite) - Fallback
    SATELLITE: {
        url: (x, y, z) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
        attribution: 'Esri, Maxar, Earthstar Geographics'
    },
    // OpenStreetMap (Street Map) - Good for labels/roads
    OSM: {
        url: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
        attribution: '© OpenStreetMap contributors'
    },
    // CartoDB Dark (Themed)
    DARK: {
        url: (x, y, z) => `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
        attribution: '© CartoDB'
    }
};

const TILE_DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_TILES === 'true';

// Get the best available satellite provider
export function getSatelliteProvider() {
    // Always attempt to use Mapbox via proxy
    return TILE_PROVIDERS.MAPBOX_SATELLITE;
}

// Convert Lat/Lon to Tile XYZ
export function latLonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y, z: zoom };
}

// Convert Tile XYZ to Lat/Lon Bounds
export function tileBounds(x, y, z) {
    const n = Math.pow(2, z);

    const minLon = (x / n) * 360 - 180;
    const maxLon = ((x + 1) / n) * 360 - 180;

    const minLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n)));
    const maxLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));

    const minLat = minLatRad * 180 / Math.PI;
    const maxLat = maxLatRad * 180 / Math.PI;

    return { minLat, maxLat, minLon, maxLon };
}

// Get center and dimensions for three-globe
export function getTileProps(x, y, z) {
    const bounds = tileBounds(x, y, z);

    return {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lon: (bounds.minLon + bounds.maxLon) / 2,
        // Add small overlap? No, gap might be visible.
        // three-globe expects centered planes.
        width: Math.abs(bounds.maxLon - bounds.minLon),
        height: Math.abs(bounds.maxLat - bounds.minLat),
        padding: 0 // Optional overlap if needed
    };
}

// Get visible tiles around a point
export function getVisibleTiles(lat, lon, zoom, radius = 2) {
    const center = latLonToTile(lat, lon, zoom);
    const tiles = [];
    const n = Math.pow(2, zoom);

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            let x = center.x + dx;
            let y = center.y + dy;

            // Wrap longitude X
            const wrappedX = (x % n + n) % n;

            // Clamp latitude Y (don't wrap poles)
            if (y >= 0 && y < n) {
                tiles.push({ x: wrappedX, y, z: zoom });
            }
        }
    }

    // Dedup?
    return tiles;
}

// Determine base zoom level based on altitude (ft)
// Mapbox supports up to zoom 22 for runway-level detail.
// We cap at zoom 12 on the globe to avoid excessive memory/texture load.
export function getZoomFromAltitude(altitudeFt) {
    if (altitudeFt < 3000) return 12;     // Very near ground - max detail
    if (altitudeFt < 8000) return 11;     // City / terminal area
    if (altitudeFt < 20000) return 10;    // Regional view (slightly higher floor)
    if (altitudeFt < 35000) return 8;     // Continental
    return 6;                             // High cruise - global (keep some detail)
}

// Calculate distance between two lat/lon points in kilometers (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Get parent tile (one zoom level lower that contains this tile)
export function getParentTile(x, y, z) {
    if (z === 0) return null; // Can't go lower than zoom 0
    return {
        x: Math.floor(x / 2),
        y: Math.floor(y / 2),
        z: z - 1
    };
}

// Get all parent tiles up to a certain zoom level (for preloading)
export function getParentTiles(x, y, z, minZoom = 0) {
    const parents = [];
    let currentX = x;
    let currentY = y;
    let currentZ = z;
    
    while (currentZ > minZoom) {
        const parent = getParentTile(currentX, currentY, currentZ);
        if (!parent) break;
        parents.push(parent);
        currentX = parent.x;
        currentY = parent.y;
        currentZ = parent.z;
    }
    
    return parents;
}

// LOD bands: distance thresholds (km), target zoom, and sampling radius (tiles).
// One band -> one resolution in view; prevents overlapping resolutions on screen.
const LOD_BANDS = [
    { maxDistance: 30, zoom: 12, radius: 1 },   // Inner core ~3x3
    { maxDistance: 90, zoom: 11, radius: 2 },   // 5x5 around
    { maxDistance: 200, zoom: 10, radius: 3 },  // 7x7 regional
    { maxDistance: 500, zoom: 9, radius: 4 },   // Wider ring
    { maxDistance: 1200, zoom: 8, radius: 5 },  // Country scale
    { maxDistance: 2500, zoom: 7, radius: 6 },  // Continental
    { maxDistance: Infinity, zoom: 6, radius: 8 } // Background
];

function clampZoom(zoom, maxZoom) {
    const MAX = Math.min(12, maxZoom);
    const MIN = 5;
    return Math.max(MIN, Math.min(MAX, zoom));
}

function summarizeByZoom(tiles) {
    return tiles.reduce((acc, t) => {
        const key = t.z ?? t.zoom;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

// Get LOD tiles with multiple zoom levels based on distance from plane position
export function getLODTiles(planeLat, planeLon, altitudeFt) {
    const tileMap = new Map(); // Track tiles by key to avoid duplicates

    // Base zoom level from altitude (caps max detail near the aircraft).
    const baseZoom = getZoomFromAltitude(altitudeFt);

    // Build band ranges with min/max distance to avoid overlap gaps.
    const bands = [];
    let prevMax = 0;
    for (const band of LOD_BANDS) {
        const targetZoom = clampZoom(band.zoom, baseZoom);
        bands.push({
            ...band,
            minDistance: prevMax,
            targetZoom
        });
        prevMax = band.maxDistance;
    }

    // First pass: for each band, collect tiles and decide renderability.
    for (const band of bands) {
        const { targetZoom, radius, minDistance, maxDistance } = band;
        const tiles = getVisibleTiles(planeLat, planeLon, targetZoom, radius);

        for (const tile of tiles) {
            const props = getTileProps(tile.x, tile.y, tile.z);
            const distance = calculateDistance(planeLat, planeLon, props.lat, props.lon);
            const inBand = distance >= minDistance && distance <= maxDistance;
            const tileKey = `${tile.x}-${tile.y}-${tile.z}`;

            if (!tileMap.has(tileKey)) {
                // Render only if in this band's distance window and zoom matches target.
                const shouldRender = inBand && tile.z === targetZoom;
                const priority = tile.z * 10000 - distance;

                tileMap.set(tileKey, {
                    ...tile,
                    ...props,
                    distance,
                    priority,
                    lodZoom: targetZoom,
                    shouldShow: shouldRender,
                    band: { minDistance, maxDistance, radius, zoom: targetZoom },
                    isParent: false,
                    isPreload: !shouldRender // anything non-rendered is preload-only
                });
            }
        }
    }

    // Second pass: add parent preload chain for each renderable tile.
    const tilesToPreload = [];
    for (const [, tile] of tileMap.entries()) {
        if (tile.shouldShow && tile.z > 0) {
            const parents = getParentTiles(tile.x, tile.y, tile.z, Math.max(0, tile.lodZoom - 2));
            for (const parent of parents) {
                const parentKey = `${parent.x}-${parent.y}-${parent.z}`;
                if (!tileMap.has(parentKey)) {
                    const parentProps = getTileProps(parent.x, parent.y, parent.z);
                    const parentDistance = calculateDistance(planeLat, planeLon, parentProps.lat, parentProps.lon);

                    tilesToPreload.push({
                        ...parent,
                        ...parentProps,
                        distance: parentDistance,
                        priority: parent.z * 10000 - parentDistance - 50000,
                        lodZoom: parent.z,
                        shouldShow: false,
                        isParent: true,
                        isPreload: true
                    });
                }
            }
        }
    }

    // Optional: child preload (next higher zoom) near aircraft for smooth promotion.
    const childPreloadRadius = 1;
    const childPreloadTiles = [];
    if (baseZoom < 12) {
        const childZoom = baseZoom + 1;
        const tiles = getVisibleTiles(planeLat, planeLon, childZoom, childPreloadRadius);
        for (const tile of tiles) {
            const props = getTileProps(tile.x, tile.y, tile.z);
            const distance = calculateDistance(planeLat, planeLon, props.lat, props.lon);
            const key = `${tile.x}-${tile.y}-${tile.z}`;
            if (!tileMap.has(key)) {
                childPreloadTiles.push({
                    ...tile,
                    ...props,
                    distance,
                    priority: childZoom * 10000 - distance + 5000,
                    lodZoom: childZoom,
                    shouldShow: false,
                    isParent: false,
                    isPreload: true
                });
            }
        }
    }

    // Add preload tiles to map
    for (const preloadTile of [...tilesToPreload, ...childPreloadTiles]) {
        const key = `${preloadTile.x}-${preloadTile.y}-${preloadTile.z}`;
        if (!tileMap.has(key)) {
            tileMap.set(key, preloadTile);
        }
    }

    const result = Array.from(tileMap.values())
        .filter(tile => {
            if (tile.shouldShow) return true;
            // Preload nearby tiles only; they won't be rendered (see Earth.jsx).
            if (tile.isPreload && tile.distance < 3000) return true;
            if (tile.isParent && tile.distance < 4000) return true;
            return false;
        })
        .sort((a, b) => {
            if (a.shouldShow !== b.shouldShow) {
                return a.shouldShow ? -1 : 1;
            }
            return b.priority - a.priority;
        });

    if (TILE_DEBUG) {
        console.debug('LOD tiles computed', {
            planeLat,
            planeLon,
            altitudeFt,
            baseZoom,
            bands,
            total: result.length,
            byZoom: summarizeByZoom(result),
            renderable: result.filter(t => t.shouldShow).length,
            preload: result.filter(t => !t.shouldShow).length
        });
    }

    if (result.length === 0 && !TILE_DEBUG) {
        console.warn('getLODTiles produced no tiles', { planeLat, planeLon, altitudeFt, baseZoom, bands });
    }

    return result;
}
