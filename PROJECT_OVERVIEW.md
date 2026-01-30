# SkyFocus - Project Overview

## What's Been Built

SkyFocus is a fully functional web-based study timer that transforms your study session into a realistic flight experience on a seatback-style in-flight entertainment display.

## ✅ Completed Features (MVP)

### Backend (Express.js)
- ✅ Data processing script that downloads and processes real aviation data
- ✅ Airport data: 3,172 airports worldwide (large/medium with scheduled service)
- ✅ Runway data: 10,611 airports with runway information
- ✅ Route data: 17,429 unique direct flight routes
- ✅ REST API with 4 endpoints:
  - `GET /api/airports` - Search and list airports
  - `GET /api/airports/:icao` - Get airport details with runways
  - `GET /api/routes/:icao` - Get all routes from an airport
  - `GET /api/routes/:icao/:time` - Find routes matching study duration (±10 min)
- ✅ CORS enabled for client communication
- ✅ Automatic data indexing for fast lookups

### Frontend (React + Vite + Tailwind)
- ✅ **Airport Selection Screen**
  - Searchable airport database
  - Real-time search with debouncing
  - Prioritizes large airports
  - Clean, dark-themed UI

- ✅ **Duration Picker**
  - Preset durations (15 min to 6 hours)
  - Custom slider (15 min to 8 hours)
  - Beautiful gradient UI

- ✅ **Route Selection**
  - Shows real routes matching selected duration
  - Displays distance, flight time, destination info
  - Sorted by best time match

- ✅ **In-Flight Display (Seatback IFE Style)**
  - Interactive Leaflet map with dark CartoDB tiles
  - Real-time flight path visualization
    - Solid blue line for completed path
    - Dotted line for remaining path
  - Airport markers (origin/destination with IATA codes)
  - Animated aircraft icon that rotates with heading
  - Dynamic zoom based on flight phase (closer for takeoff/landing)

- ✅ **Flight Data Panel**
  - Ground speed (knots)
  - Altitude (feet)
  - Heading (degrees)
  - Distance traveled/remaining/total (miles)
  - Time elapsed/remaining
  - Outside air temperature (calculated by altitude)
  - Local times at origin and destination
  - Current route display

- ✅ **Progress Bar**
  - Visual flight progress (0-100%)
  - Smooth gradient animation

- ✅ **Pause/Resume**
  - Spacebar keyboard shortcut
  - On-screen pause button
  - Dark overlay when paused
  - Timer and flight hold position

- ✅ **Landing & Stats Summary**
  - Automatic detection when flight completes
  - Shows:
    - Route flown (IATA codes + cities)
    - Total study time
    - Distance covered
    - Max altitude reached
    - Average ground speed
  - "Book Another Flight" button to restart

### Flight Simulation Engine
- ✅ **Great Circle Navigation**
  - Haversine formula for accurate distance calculation
  - Interpolated points along great circle path (200 points)
  - Smooth position updates via requestAnimationFrame

- ✅ **Realistic Altitude Profiles**
  - Dynamic cruise altitude based on route distance
    - Short (<200nm): 15,000 ft
    - Regional (200-500nm): 25,000 ft
    - Medium (500-1500nm): 33,000 ft
    - Long (1500-3000nm): 37,000 ft
    - Ultra long (>3000nm): 41,000 ft
  - Realistic climb rate: 2,500 ft/min
  - Realistic descent rate: 2,000 ft/min
  - Smooth S-curve transitions (not linear)

- ✅ **Speed Simulation**
  - Base cruise speed: 500 knots
  - Slower during takeoff/landing (60% speed)
  - Gradual acceleration during climb
  - Full speed at cruise altitude

- ✅ **Runway Alignment**
  - Automatic selection of longest runway at each airport
  - Takeoff follows actual runway heading
  - Landing approach aligns with destination runway
  - Realistic turn calculations (3°/sec turn rate)

- ✅ **Environmental Calculations**
  - Outside air temperature based on ISA standard atmosphere
  - -2°C per 1000 ft lapse rate up to tropopause
  - Constant -56.5°C in stratosphere

### State Management
- ✅ Zustand store for global state
- ✅ Clean separation of concerns
- ✅ Reactive updates across all components

### Styling & UX
- ✅ Dark theme optimized for long study sessions
- ✅ IFE-inspired color scheme (dark blues, muted colors)
- ✅ Responsive layout (desktop/tablet focused)
- ✅ Smooth animations and transitions
- ✅ Monospace fonts for data displays
- ✅ Professional aviation aesthetic

## 🗂️ Project Structure

```
skyfocus/
├── server/
│   ├── api/
│   │   └── routes.js          # Express API endpoints
│   ├── data/
│   │   ├── raw/               # Downloaded CSVs (gitignored)
│   │   └── processed/         # Optimized JSON files
│   ├── scripts/
│   │   └── processData.js     # Data download & processing
│   ├── index.js               # Server entry point
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AirportSelector/
│   │   │   ├── DurationPicker/
│   │   │   ├── RouteList/
│   │   │   ├── FlightDisplay/
│   │   │   │   ├── Map/
│   │   │   │   ├── DataPanel/
│   │   │   │   ├── ProgressBar/
│   │   │   │   └── PauseOverlay/
│   │   │   └── StatsSummary/
│   │   ├── hooks/
│   │   │   └── useFlightSimulation.js
│   │   ├── store/
│   │   │   └── flightStore.js
│   │   ├── utils/
│   │   │   ├── flightMath.js
│   │   │   └── timeUtils.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── plane.svg
│   ├── package.json
│   └── vite.config.js
├── README.md
├── QUICKSTART.md
└── .gitignore
```

## 🎯 How It Works

1. **User selects home airport** → Client queries `/api/airports` with search term
2. **User picks duration** → Client calculates target flight time
3. **User sees matching routes** → Client queries `/api/routes/:icao/:time`
4. **User selects route** → Client fetches full airport details with runways
5. **Flight initialization**:
   - Calculate great circle path (200 interpolated points)
   - Determine cruise altitude based on distance
   - Calculate altitude profile (climb/cruise/descent phases)
   - Select runways (longest at each airport)
6. **Real-time simulation** (runs every frame):
   - Update progress based on elapsed time
   - Calculate current position along path
   - Determine altitude based on flight phase
   - Calculate heading from current to next waypoint
   - Apply speed multipliers for realistic acceleration
   - Update all UI components reactively
7. **Map rendering**:
   - Center on aircraft position
   - Adjust zoom based on flight phase
   - Render completed path (solid), remaining path (dotted)
   - Rotate aircraft icon to match heading
8. **Landing**:
   - Auto-detect when progress reaches 100%
   - Calculate final statistics
   - Display summary screen

## 📊 Technical Highlights

### Performance Optimizations
- Pre-calculated flight paths (not computed every frame)
- Efficient state updates with Zustand
- Debounced search inputs
- Memoized calculations where appropriate
- Smooth animations with requestAnimationFrame

### Math & Calculations
- Great circle distance: Haversine formula
- Great circle interpolation: Spherical geometry
- Bearing calculations: Forward azimuth
- Altitude profiles: Smooth step functions
- ISA atmospheric model: Standard atmosphere calculations

### Data Processing
- CSV parsing with error handling
- Deduplication of bidirectional routes
- IATA ↔ ICAO code conversion
- Distance and time pre-calculation
- Efficient JSON indexing by airport code

## 🚀 Ready to Run

All dependencies are installed:
- Server: 78 packages
- Client: 139 packages

Data is processed:
- 3,172 airports loaded
- 17,429 routes calculated
- All runways indexed

Server tested and working:
- API responds correctly
- Data loads successfully
- CORS configured

## 📈 Future Enhancement Possibilities

The codebase is architected to support:
- User accounts & flight history (add auth, database)
- 3D aircraft view (Three.js integration)
- Multiple aircraft types (performance profiles)
- Achievement system (badges, streaks)
- Sound ambiance (cabin noise, announcements)
- Theme system (different airline IFE styles)
- Real waypoint data (FAA CIFP)
- Break/layover system (multi-leg journeys)
- Mobile optimization
- Weather simulation
- Turbulence effects
- Step climbs on long flights

## 🎓 What You Can Learn From This Project

- Great circle navigation mathematics
- Real-time animation with React
- State management patterns
- RESTful API design
- Data processing pipelines
- Aviation physics simulation
- Atmospheric calculations
- Map visualization with Leaflet
- Dark theme design
- Performance optimization techniques

## 🌟 What Makes It Special

- **Real data**: Actual airports and routes, not fake data
- **Realistic physics**: True great circle paths, accurate altitude profiles
- **Attention to detail**: Runway alignment, smooth turns, realistic speeds
- **Beautiful UX**: Professional IFE aesthetic, smooth animations
- **Educational**: Learn geography while studying
- **Motivating**: Gamifies study time with a clear goal (landing)

Enjoy your flight! ✈️
