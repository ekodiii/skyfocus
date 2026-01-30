// Flight mathematics and calculations

const EARTH_RADIUS_NM = 3440.065; // nautical miles
const EARTH_RADIUS_KM = 6371; // kilometers

export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

// Haversine distance formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c; // nautical miles
}

// Calculate initial bearing from point 1 to point 2
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
            Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360
}

// Calculate destination point given start point, bearing, and distance
export function calculateDestination(lat, lon, bearing, distance) {
  const angularDistance = distance / EARTH_RADIUS_NM;
  const bearingRad = toRadians(bearing);
  const latRad = toRadians(lat);
  const lonRad = toRadians(lon);

  const lat2 = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lon2 = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2)
  );

  return {
    lat: toDegrees(lat2),
    lon: toDegrees(lon2)
  };
}

// Interpolate points along great circle path
export function interpolateGreatCircle(lat1, lon1, lat2, lon2, numPoints = 100) {
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const point = interpolatePoint(lat1, lon1, lat2, lon2, fraction);
    points.push(point);
  }

  return points;
}

// Interpolate single point along great circle
export function interpolatePoint(lat1, lon1, lat2, lon2, fraction) {
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat1Rad - lat2Rad) / 2), 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.pow(Math.sin((lon1Rad - lon2Rad) / 2), 2)
  ));

  const a = Math.sin((1 - fraction) * d) / Math.sin(d);
  const b = Math.sin(fraction * d) / Math.sin(d);

  const x = a * Math.cos(lat1Rad) * Math.cos(lon1Rad) +
            b * Math.cos(lat2Rad) * Math.cos(lon2Rad);
  const y = a * Math.cos(lat1Rad) * Math.sin(lon1Rad) +
            b * Math.cos(lat2Rad) * Math.sin(lon2Rad);
  const z = a * Math.sin(lat1Rad) + b * Math.sin(lat2Rad);

  const latRad = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lonRad = Math.atan2(y, x);

  return {
    lat: toDegrees(latRad),
    lon: toDegrees(lonRad)
  };
}

// Calculate smooth turn between two headings
export function calculateTurn(currentHeading, targetHeading, turnRate = 3) {
  // turnRate in degrees per second
  let diff = targetHeading - currentHeading;

  // Normalize to -180 to 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  // Limit turn rate
  if (Math.abs(diff) < turnRate) {
    return targetHeading;
  }

  return currentHeading + (diff > 0 ? turnRate : -turnRate);
}

// Calculate cruise altitude based on distance
export function calculateCruiseAltitude(distanceNM) {
  if (distanceNM < 200) return 15000; // Short flights
  if (distanceNM < 500) return 25000; // Regional
  if (distanceNM < 1500) return 33000; // Medium haul
  if (distanceNM < 3000) return 37000; // Long haul
  return 41000; // Ultra long haul
}

// Calculate altitude profile for flight
export function calculateAltitudeProfile(distanceNM, cruiseAltitude, durationMinutes) {
  const climbRate = 2500; // ft/min
  const descentRate = 2000; // ft/min

  const climbTime = cruiseAltitude / climbRate; // minutes
  const descentTime = cruiseAltitude / descentRate; // minutes

  const climbDistance = (climbTime / durationMinutes) * distanceNM;
  const descentDistance = (descentTime / durationMinutes) * distanceNM;

  return {
    climbRate,
    descentRate,
    climbTime,
    descentTime,
    climbDistance,
    descentDistance,
    cruiseStart: climbDistance / distanceNM,
    descentStart: (distanceNM - descentDistance) / distanceNM
  };
}

// Get altitude at specific progress point (0-1)
export function getAltitudeAtProgress(progress, profile, cruiseAltitude) {
  if (progress < profile.cruiseStart) {
    // Climbing
    const climbProgress = progress / profile.cruiseStart;
    // Smooth S-curve for realistic climb
    const smoothProgress = smoothStep(climbProgress);
    return smoothProgress * cruiseAltitude;
  } else if (progress < profile.descentStart) {
    // Cruise
    return cruiseAltitude;
  } else {
    // Descending
    const descentProgress = (progress - profile.descentStart) / (1 - profile.descentStart);
    const smoothProgress = smoothStep(descentProgress);
    return cruiseAltitude * (1 - smoothProgress);
  }
}

// Smooth step function for realistic acceleration/deceleration
function smoothStep(x) {
  return x * x * (3 - 2 * x);
}

// Get speed multiplier based on altitude and phase
export function getSpeedMultiplier(altitude, cruiseAltitude) {
  const altitudeRatio = altitude / cruiseAltitude;

  if (altitudeRatio < 0.3) {
    // Takeoff/landing - slower
    return 0.6;
  } else if (altitudeRatio < 0.7) {
    // Climb/descent - building speed
    return 0.8 + (altitudeRatio - 0.3) * 0.5;
  } else {
    // Cruise - full speed
    return 1.0;
  }
}

// Convert nautical miles to kilometers
export function nmToKm(nm) {
  return nm * 1.852;
}

// Convert nautical miles to statute miles
export function nmToMiles(nm) {
  return nm * 1.15078;
}

// Convert knots to mph
export function knotsToMph(knots) {
  return knots * 1.15078;
}

// Calculate outside air temperature based on altitude
export function calculateOAT(altitudeFeet) {
  // ISA standard: 15°C at sea level, -2°C per 1000ft up to tropopause (~36,000ft)
  const seaLevelTemp = 15; // Celsius
  const lapseRate = 2; // °C per 1000ft

  if (altitudeFeet <= 36000) {
    return seaLevelTemp - (altitudeFeet / 1000) * lapseRate;
  } else {
    // Stratosphere - constant temp
    return -56.5;
  }
}

// Convert Celsius to Fahrenheit
export function celsiusToFahrenheit(celsius) {
  return (celsius * 9/5) + 32;
}
