import { create } from 'zustand';

const useFlightStore = create((set, get) => ({
  // App state
  screen: 'airport-selection', // airport-selection, duration-selection, route-selection, in-flight, summary

  // Selected data
  selectedAirport: null,
  selectedDuration: 60, // minutes
  selectedRoute: null,
  destinationAirport: null,

  // Flight state
  isPaused: false,
  isFlying: false,
  isLoadingTiles: false, // Loading tiles for destination airport
  elapsedTime: 0, // seconds
  progress: 0, // 0-1
  position: null, // { lat, lon }
  altitude: 0, // feet
  heading: 0, // degrees
  speed: 0, // knots
  pitch: 0, // degrees (nose up positive)
  bank: 0, // degrees (right bank positive)
  phase: 'preflight', // current flight phase

  // Flight data
  flightPath: [], // array of { lat, lon }
  totalDistance: 0, // nautical miles
  cruiseAltitude: 0,
  altitudeProfile: null,

  // Runways
  departureRunway: null,
  arrivalRunway: null,

  // Stats
  stats: {
    totalTime: 0,
    distanceTraveled: 0,
    maxAltitude: 0,
    averageSpeed: 0
  },

  // Actions
  setScreen: (screen) => set({ screen }),

  setSelectedAirport: (airport) => set({ selectedAirport: airport }),

  setSelectedDuration: (duration) => set({ selectedDuration: duration }),

  setSelectedRoute: (route, destinationAirport, departureRunway, arrivalRunway) => set({
    selectedRoute: route,
    destinationAirport,
    departureRunway,
    arrivalRunway
  }),

  setFlightData: (flightPath, totalDistance, cruiseAltitude, altitudeProfile) => set({
    flightPath,
    totalDistance,
    cruiseAltitude,
    altitudeProfile
  }),

  startFlight: () => set({
    isFlying: true,
    isPaused: false,
    elapsedTime: 0,
    progress: 0,
    screen: 'in-flight'
  }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setLoadingTiles: (loading) => set({ isLoadingTiles: loading }),

  updateFlightState: (position, altitude, heading, speed, progress, pitch = 0, bank = 0, phase = 'cruise') => set((state) => {
    const newStats = { ...state.stats };
    if (altitude > newStats.maxAltitude) {
      newStats.maxAltitude = altitude;
    }
    return {
      position,
      altitude,
      heading,
      speed,
      progress,
      pitch,
      bank,
      phase,
      stats: newStats
    };
  }),

  incrementTime: () => set((state) => ({
    elapsedTime: state.elapsedTime + 1
  })),

  endFlight: () => {
    const state = get();
    set({
      isFlying: false,
      screen: 'summary',
      stats: {
        ...state.stats,
        totalTime: state.elapsedTime,
        distanceTraveled: state.totalDistance * state.progress,
        averageSpeed: state.totalDistance / (state.elapsedTime / 3600)
      }
    });
  },

  reset: () => set({
    screen: 'airport-selection',
    selectedAirport: null,
    selectedDuration: 60,
    selectedRoute: null,
    destinationAirport: null,
    isPaused: false,
    isFlying: false,
    isLoadingTiles: false,
    elapsedTime: 0,
    progress: 0,
    position: null,
    altitude: 0,
    heading: 0,
    speed: 0,
    flightPath: [],
    totalDistance: 0,
    cruiseAltitude: 0,
    altitudeProfile: null,
    departureRunway: null,
    arrivalRunway: null,
    stats: {
      totalTime: 0,
      distanceTraveled: 0,
      maxAltitude: 0,
      averageSpeed: 0
    }
  })
}));

export default useFlightStore;
