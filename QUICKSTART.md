# Quick Start Guide

## First Time Setup

1. **Process the aviation data** (only needed once):
```bash
cd server
npm run process-data
```

This downloads airport and route data from OurAirports and OpenFlights (~30 seconds).

## Running the Application

You need to run both the server and client:

### Terminal 1 - Start the Server
```bash
cd server
npm start
```

Server will run on `http://localhost:3001`

### Terminal 2 - Start the Client
```bash
cd client
npm run dev
```

Client will run on `http://localhost:3000`

### Open the App
Navigate to `http://localhost:3000` in your browser.

## Using SkyFocus

1. **Select your home airport** - Search for any major airport
2. **Choose study duration** - Pick from presets or use the slider
3. **Select a flight route** - Choose from real routes matching your study time
4. **Start studying!** - Your flight begins in real-time
5. **Press SPACE** to pause/resume anytime
6. **View stats** when you land

## Troubleshooting

**"Data not loaded" error:**
- Make sure you ran `npm run process-data` in the server directory
- Check that `server/data/processed/` contains JSON files

**Can't find routes for your airport:**
- Try a major hub airport (JFK, LAX, LHR, SFO, ORD, etc.)
- Adjust your duration - some airports have limited route options

**Client won't start:**
- Make sure server is running first (port 3001)
- Check that you ran `npm install` in both directories

## Tips

- Use shorter durations (15-30 min) for quick study sessions
- Long-haul routes (4+ hours) show realistic cruise altitude (~41,000 ft)
- The flight progresses in real-time - your study timer = flight duration
- Dark theme is optimized for long study sessions

Enjoy your flight! ✈️
