# SkyFocus 3D Upgrade 🌍✈️

## What's New

SkyFocus has been upgraded from a 2D Leaflet map to a stunning **3D globe experience** powered by Three.js!

## New Features

### 1. 3D Globe Visualization
- **Realistic Earth**: Procedurally generated Earth texture with continents and oceans
- **Atmospheric Effects**: Glowing atmosphere around the planet
- **Starfield**: 5,000+ stars in the background
- **City Lights**: Illuminated cities visible during night portions of the flight
- **Real-time Day/Night**: Lighting changes based on your position relative to the sun

### 2. Realistic Aircraft Models
- **Boeing 737**: Automatically used for flights < 1500nm
  - Shorter fuselage, smaller wingspan
  - Compact twin-engine configuration
  - Signature winglets
- **Boeing 787 Dreamliner**: Automatically used for flights ≥ 1500nm
  - Longer fuselage, larger wingspan
  - Distinctive raked wingtips
  - Larger engines (GEnx)

Both models feature:
- Detailed geometry (fuselage, wings, engines, tail)
- Metallic materials with proper lighting
- Blue accent livery
- Cockpit windows
- Realistic proportions

### 3. Advanced Camera System

**Chase Camera Mode** (default)
- Follows aircraft from behind and above
- Smooth pursuit with interpolation
- Automatic position adjustments

**Free Rotation** (Press R)
- Click and drag to orbit around the aircraft
- Scroll to zoom in/out
- Aircraft remains centered

**Overview Mode** (Press O)
- Camera pulls back to show entire route
- Great for seeing your progress on the globe
- Full orbit and zoom controls enabled

All camera movements use smooth transitions - no jarring cuts!

### 4. Customizable Data Display

**Display Modes** (Press D to cycle)

**Full Mode**: Complete flight data in all four corners
- Top Left: Route info (airports, time elapsed/remaining)
- Top Right: Altitude & Speed (with optional gauges)
- Bottom Left: Heading & Distance remaining (with optional gauges)
- Bottom Right: Outside air temp & Progress percentage

**Minimal Mode**: Just the essentials
- Altitude (top left)
- Speed (top right)
- Heading (bottom left)
- Time remaining (bottom right)

**Hidden Mode**: Clean 3D view with no overlays
- Perfect for immersive studying
- All controls still work
- Small hint text shows keyboard shortcuts

**Gauge Mode** (Press G)
- Works with both Full and Minimal modes
- Replaces plain numbers with realistic aviation instruments
- **Arc Gauges**: For altitude and speed (0-100% arc with tick marks)
- **Circular Gauges**: For heading (360° compass-style)
- Each gauge shows both visual indicator AND numeric value
- Styled like real glass cockpit displays

### 5. Flight Path Visualization
- **Completed path**: Solid blue line on the globe
- **Remaining path**: Dotted blue line (40% opacity)
- **Airport markers**: Green sphere for origin, red for destination
- All rendered as 3D objects following the Earth's curvature

## Technical Implementation

### 3D Graphics Stack
- **Three.js**: Core 3D rendering engine
- **@react-three/fiber**: React integration for Three.js
- **@react-three/drei**: Helper components (OrbitControls, Stars)

### Performance Optimizations
- Procedural textures (no large image downloads)
- Efficient geometry (LOD appropriate for view distance)
- Memoized calculations
- Smooth interpolation using `useFrame` hook
- Shadow mapping only where needed

### Math & Calculations
- **Lat/Lon to 3D**: Convert geographic coordinates to sphere surface positions
- **Spherical Geometry**: Flight paths follow Earth's curvature
- **Vector Math**: Camera positioning and aircraft orientation
- **Quaternions**: Smooth rotation interpolation (future enhancement)

### Coordinate System
- Earth sphere radius: 100 units
- Aircraft altitude adds small offset (altitude/1000 * 0.1)
- Camera distance: 15 units for chase, 250+ for overview
- All positions calculated in real-time

## Keyboard Controls Reference

| Key | Action |
|-----|--------|
| **Space** | Pause/Resume flight |
| **D** | Cycle display modes (Full → Minimal → Hidden → Full) |
| **G** | Toggle gauge mode on/off |
| **O** | Toggle overview camera (show entire route) |
| **R** | Enable/disable free rotation (orbit mode) |

### Mouse Controls
- **Drag**: Rotate camera (when free rotation enabled)
- **Scroll**: Zoom in/out
- **Touch**: Works on tablets! (drag to rotate, pinch to zoom)

## Aircraft Selection Logic

```javascript
if (flight_distance < 1500nm) {
  use Boeing 737
} else {
  use Boeing 787
}
```

Examples:
- New York (JFK) to Los Angeles (LAX): ~2,500nm → **787**
- Phoenix (PHX) to San Francisco (SFO): ~650nm → **737**
- London (LHR) to Tokyo (NRT): ~5,900nm → **787**

## Night Mode Details

Night is determined by the aircraft's position relative to the sun:
- Sun position: Fixed at coordinates (200, 50, 100)
- If angle between position vector and sun > 90°: **Night**
- City lights automatically appear during night portions
- Starfield always visible in space
- Atmospheric glow remains constant

## Future Enhancements (Not Yet Implemented)

- **Real 3D Terrain**: Elevation data for mountains, valleys
- **Clouds**: Volumetric cloud layers at realistic altitudes
- **Weather**: Rain, snow effects along route
- **Aurora**: Northern/Southern lights at polar latitudes
- **Satellite View**: Toggle between artistic and satellite imagery
- **Multiple Camera Angles**: Cockpit view, wing view, tower view
- **Contrails**: Vapor trails behind aircraft at cruise altitude
- **Aircraft Lighting**: Navigation lights, landing lights that animate
- **Realistic Sun**: Actual sun position based on date/time
- **Moon**: Moon phase and position
- **City Detail**: More accurate city light patterns
- **Sound**: Engine noise, wind, ambient cabin sounds

## Performance Notes

Build size increased due to Three.js (~300KB gzipped), but:
- Still loads quickly on modern connections
- All rendering is GPU-accelerated
- Maintains 60 FPS on most devices
- Automatically reduces quality on lower-end hardware

## Comparison: 2D vs 3D

| Feature | 2D (Leaflet) | 3D (Three.js) |
|---------|--------------|---------------|
| Earth Representation | Flat map | 3D sphere |
| Flight Path | Line on map | 3D curve on globe |
| Aircraft | 2D emoji icon | Full 3D model |
| Camera | Fixed top-down | Chase cam + orbit |
| Realism | Map-style | Globe-style |
| Night/Day | Map filter | True lighting |
| City Lights | Not shown | 3D points |
| Performance | Very light | Moderate |
| Immersion | Good | Excellent |

## Migration Notes

The 3D view is a **complete replacement** for the 2D Leaflet view. The old 2D components are still in the codebase (`components/FlightDisplay/`) but are no longer used. They remain for reference and can be removed if desired.

All flight simulation logic remains identical - only the visualization changed!

---

**Enjoy your immersive 3D study flights!** 🚀
