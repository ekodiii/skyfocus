import { useEffect, useRef } from 'react';
import useFlightStore from '../store/flightStore';
import { FlightPhaseEngine } from '../utils/FlightPhaseEngine';
import {
  interpolateGreatCircle,
  calculateDistance,
  calculateCruiseAltitude,
  calculateAltitudeProfile
} from '../utils/flightMath';
import { fetchAirport } from '../api/client';

export default function useFlightSimulation() {
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const phaseEngineRef = useRef(null);

  const {
    isFlying,
    isPaused,
    selectedAirport,
    destinationAirport,
    selectedRoute,
    selectedDuration,
    elapsedTime,
    setFlightData,
    startFlight,
    updateFlightState,
    incrementTime,
    endFlight
  } = useFlightStore();

  // Initialize flight on mount
  useEffect(() => {
    if (selectedRoute && selectedAirport && destinationAirport) {
      initializeFlight();
    }
  }, [selectedRoute]);

  const initializeFlight = async () => {
    // Determine IDs
    let originIcao = selectedAirport.icao;
    let destIcao = destinationAirport.icao;

    // Fetch full airport data including runways
    let enrichedOrigin = selectedAirport;
    let enrichedDest = destinationAirport;

    try {
      // Parallel fetch for speed
      const [originData, destData] = await Promise.all([
        fetchAirport(originIcao).catch(e => selectedAirport),
        fetchAirport(destIcao).catch(e => destinationAirport)
      ]);

      enrichedOrigin = originData;
      enrichedDest = destData;

      // Transform runway data structure to match FlightPhaseEngine expectations
      // Runways come with le_lat/le_lon (low end) and he_lat/he_lon (high end)
      // FlightPhaseEngine expects start and end properties
      // For departure: start = le (threshold), end = he
      // For arrival: end = le (threshold where we land), start = he (approach end)
      if (enrichedOrigin.runways) {
        enrichedOrigin.runways = enrichedOrigin.runways.map(rwy => ({
          ...rwy,
          start: { lat: rwy.le_lat, lon: rwy.le_lon },
          end: { lat: rwy.he_lat, lon: rwy.he_lon }
        }));
      }
      if (enrichedDest.runways) {
        enrichedDest.runways = enrichedDest.runways.map(rwy => ({
          ...rwy,
          start: { lat: rwy.he_lat, lon: rwy.he_lon }, // Approach end
          end: { lat: rwy.le_lat, lon: rwy.le_lon }    // Threshold (where we land)
        }));
      }
    } catch (err) {
      console.warn('Could not fetch detailed runway data:', err);
    }

    // Calculate basic great circle for distance calc
    const tempPath = interpolateGreatCircle(
      enrichedOrigin.lat,
      enrichedOrigin.lon,
      enrichedDest.lat,
      enrichedDest.lon,
      20
    );

    // Calculate total distance
    const totalDistance = calculateDistance(
      enrichedOrigin.lat,
      enrichedOrigin.lon,
      enrichedDest.lat,
      enrichedDest.lon
    );

    // Determine cruise altitude
    const cruiseAltitude = calculateCruiseAltitude(totalDistance);

    // Calculate altitude profile
    const altitudeProfile = calculateAltitudeProfile(
      totalDistance,
      cruiseAltitude,
      selectedDuration
    );

    // Create the flight phase engine with real runway data
    phaseEngineRef.current = new FlightPhaseEngine({
      origin: enrichedOrigin,
      destination: enrichedDest,
      originRunways: enrichedOrigin.runways,
      destinationRunways: enrichedDest.runways,
      flightPath: tempPath, // Initial path for engine reference
      totalDistance,
      cruiseAltitude,
      duration: selectedDuration
    });

    // Generate accurate flight path covering all phases (takeoff, cruise, landing)
    const flightPath = phaseEngineRef.current.generateFlightPath(500);

    setFlightData(flightPath, totalDistance, cruiseAltitude, altitudeProfile);
    startFlight();
  };

  // Main animation loop
  useEffect(() => {
    if (!isFlying) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000; // seconds
      lastUpdateRef.current = now;

      if (!isPaused) {
        updateFlightPosition(deltaTime);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlying, isPaused]);

  // Timer (1 second intervals)
  useEffect(() => {
    if (!isFlying || isPaused) return;

    const timer = setInterval(() => {
      incrementTime();

      // Check if flight is complete
      if (elapsedTime >= selectedDuration * 60) {
        endFlight();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isFlying, isPaused, elapsedTime, selectedDuration]);

  const updateFlightPosition = (deltaTime) => {
    const store = useFlightStore.getState();
    const { elapsedTime, selectedDuration } = store;

    if (!phaseEngineRef.current) return;

    // Calculate progress (0-1) based on elapsed time
    const progress = Math.min(elapsedTime / (selectedDuration * 60), 1);

    // Get complete flight state from the phase engine
    const flightState = phaseEngineRef.current.calculateFlightState(progress, elapsedTime, deltaTime);

    // Update store with all the new state
    updateFlightState(
      flightState.position,
      Math.round(flightState.altitude),
      Math.round(flightState.heading),
      Math.round(flightState.speed),
      progress,
      flightState.pitch,
      flightState.bank,
      flightState.phase
    );
  };

  return null;
}
