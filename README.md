# SkyFocus ✈️

A web-based study timer that displays your study session as a realistic flight on a seatback-style in-flight entertainment (IFE) screen.

## Features

- **Real Flight Routes**: Study sessions matched to actual flight routes from airports worldwide
- **3D Globe Visualization**: Stunning Three.js 3D Earth with realistic aircraft models
  - Procedural Boeing 737 (short flights <1500nm) and 787 (long flights)
  - City lights that illuminate at night
  - Atmospheric effects and starfield
  - Real-time flight path visualization on globe
- **Realistic Flight Simulation**: Great circle navigation, accurate altitude profiles, runway alignment
- **Advanced Camera System**:
  - Chase camera that follows aircraft
  - Click/drag to orbit around plane
  - Overview mode to see entire route
  - Smooth camera transitions
- **Customizable Data Display**:
  - **Minimal Mode**: Key stats in corners (altitude, speed, heading, time)
  - **Full Mode**: Complete flight data spread across screen
  - **Gauge Mode**: Realistic aviation instruments with arc/circular gauges
  - **Hidden Mode**: Clean view with no overlays
  - Toggle between modes with keyboard shortcuts
- **Pause/Resume**: Spacebar to pause your study session
- **Flight Stats**: Summary of your study session with distance, time, and altitude stats

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, Three.js + React Three Fiber, Zustand state management
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Backend**: Express.js, Node.js
- **Data**: OurAirports & OpenFlights (real airport and route data)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Install server dependencies and process data:**

```bash
cd server
npm install
npm run process-data  # Downloads and processes airport/route data (takes ~30 seconds)
```

2. **Install client dependencies:**

```bash
cd ../client
npm install
```

### Running the Application

1. **Start the server** (from `/server`):

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

Server runs on `http://localhost:3001`

2. **Start the client** (from `/client` in a new terminal):

```bash
npm run dev
```

Client runs on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## How to Use

1. **Select your home airport** - Search by city, airport name, or code
2. **Choose study duration** - Use presets or slider (15 min to 8 hours)
3. **Pick a flight route** - See real routes that match your study time
4. **Study!** - Watch your flight progress in real-time in stunning 3D
5. **View your stats** when the flight lands

### Keyboard Controls (During Flight)

- **Space** - Pause/Resume flight
- **D** - Cycle data display modes (Full → Minimal → Hidden)
- **G** - Toggle gauge mode (show instruments instead of just numbers)
- **O** - Toggle overview camera mode (see entire route)
- **R** - Enable free rotation (orbit around the aircraft)
- **Mouse drag** - Rotate camera (when free rotation enabled)
- **Mouse scroll** - Zoom in/out

## Project Structure

```
skyfocus/
├── server/               # Express backend
│   ├── api/             # API routes
│   ├── data/            # Processed aviation data
│   ├── scripts/         # Data processing scripts
│   └── index.js         # Server entry point
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── store/       # Zustand state management
│   │   ├── utils/       # Flight math & utilities
│   │   └── api/         # API client
│   └── public/
└── README.md
```

## Data Sources

- **Airport Data**: [OurAirports](https://ourairports.com/data/)
- **Route Data**: [OpenFlights](https://openflights.org/data/)

Data is automatically downloaded and processed when you run `npm run process-data`.

## Development Notes

- Flight simulation runs entirely client-side using great circle mathematics
- Altitude profiles are calculated based on distance (realistic climb/descent rates)
- Runways are selected automatically (longest available)
- Map uses CartoDB dark basemap with OpenStreetMap data
- Timer matches selected study duration exactly

## Future Enhancements (Not Implemented)

- User accounts & flight history
- 3D terrain/aircraft view
- Multiple aircraft types
- Achievement system
- Sound ambiance
- Different airline IFE themes
- Real FAA waypoint data
- Break system with layovers

## License

MIT

## Credits

Built with ☕ and ✈️

Aviation data provided by OurAirports and OpenFlights.
