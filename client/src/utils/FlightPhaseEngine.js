// FlightPhaseEngine.js
// Realistic flight simulation with proper takeoff, departure, approach and landing patterns

export const FLIGHT_PHASES = {
    PREFLIGHT: 'preflight',
    TAKEOFF_ROLL: 'takeoff_roll',
    ROTATE: 'rotate',
    LIFTOFF: 'liftoff',
    INITIAL_CLIMB: 'initial_climb',
    DEPARTURE_PROCEDURE: 'departure_procedure', // SID
    CRUISE: 'cruise',
    ARRIVAL_PROCEDURE: 'arrival_procedure',     // STAR
    FINAL: 'final',
    FLARE: 'flare',
    TOUCHDOWN: 'touchdown',
    ROLLOUT: 'rollout',
    COMPLETE: 'complete'
};

// Aircraft performance parameters (Boeing 737-800 approximation)
export const AIRCRAFT_PARAMS = {
    // Speeds (knots)
    V1: 130,           // Decision speed
    VR: 145,           // Rotation speed
    V2: 160,           // Takeoff safety speed
    VCLIMB: 250,       // Climb speed below 10,000 ft
    VCRUISE: 450,      // Cruise speed (knots TAS)
    VAPPROACH: 180,    // Initial approach speed
    VREF: 145,         // Reference landing speed
    VTOUCHDOWN: 135,   // Touchdown speed

    // Vertical rates (feet per minute)
    CLIMB_RATE_INITIAL: 3000,
    CLIMB_RATE_CRUISE: 2000,
    DESCENT_RATE: 1800,

    // Altitudes (feet)
    SID_ALTITUDE: 10000,       // Target altitude for SID exit
    STAR_ENTRY_ALTITUDE: 12000,// Altitude to start STAR
    INTERCEPT_ALTITUDE: 3000,  // Altitude to intercept final approach

    // Distances (nm)
    TAKEOFF_ROLL: 1.5,
    INITIAL_CLIMB: 3.0,
    FINAL_APPROACH: 10.0,      // 10nm final approach
};

export class FlightPhaseEngine {
    constructor(flightData) {
        this.origin = flightData.origin;
        this.destination = flightData.destination;
        this.rawFlightPath = flightData.flightPath || [];
        this.totalDistance = flightData.totalDistance;
        this.cruiseAltitude = flightData.cruiseAltitude;
        this.totalDuration = flightData.duration * 60; // seconds

        // Select runways
        this.departureRunway = this.selectRunway(flightData.originRunways, this.rawFlightPath[1], true);
        this.arrivalRunway = this.selectRunway(flightData.destinationRunways, this.rawFlightPath[this.rawFlightPath.length - 2], false);

        // Debug logging for runways
        if (!this.departureRunway) console.warn('[FlightPhaseEngine] No departure runway found');
        else if (!this.departureRunway.start) console.warn('[FlightPhaseEngine] Departure runway missing start geometry:', this.departureRunway);

        if (!this.arrivalRunway) console.warn('[FlightPhaseEngine] No arrival runway found');
        else if (!this.arrivalRunway.end) console.warn('[FlightPhaseEngine] Arrival runway missing end geometry:', this.arrivalRunway);

        // Setup geometries - WRAP IN TRY/CATCH for safety
        try {
            this.setupGeometries();
        } catch (err) {
            console.error('[FlightPhaseEngine] Error setting up geometries:', err);
            // Fallback to airport coordinates if geometry setup fails
            this.depThreshold = { lat: this.origin.lat, lon: this.origin.lon };
            this.depHeading = 0;
            this.arrThreshold = { lat: this.destination.lat, lon: this.destination.lon };
            this.arrHeading = 0;
        }

        // 1. Generate the unified path
        try {
            this.generateUnifiedPath();
        } catch (err) {
            console.error('[FlightPhaseEngine] Error generating path:', err);
            this.fullPath = []; // Safe fallback
        }

        // Initialize state
        this.currentPhase = FLIGHT_PHASES.PREFLIGHT;
        this.lastBank = 0;
        this.lastPitch = 0;
        this.lastHeading = this.departureHeading || 0;
    }

    setupGeometries() {
        // Departure
        if (this.departureRunway && this.departureRunway.start) {
            this.depThreshold = { lat: this.departureRunway.start.lat, lon: this.departureRunway.start.lon };
            this.depHeading = this.departureRunway.heading;
        } else {
            console.log('[FlightPhaseEngine] using default departure coords');
            this.depThreshold = { lat: this.origin.lat, lon: this.origin.lon };
            this.depHeading = this.calculateBearing(this.origin, this.rawFlightPath[1] || this.destination);
        }

        // Arrival
        if (this.arrivalRunway && this.arrivalRunway.end) {
            this.arrThreshold = { lat: this.arrivalRunway.end.lat, lon: this.arrivalRunway.end.lon };
            this.arrHeading = this.arrivalRunway.heading;
        } else {
            console.log('[FlightPhaseEngine] using default arrival coords');
            this.arrThreshold = { lat: this.destination.lat, lon: this.destination.lon };
            this.arrHeading = this.calculateBearing(this.rawFlightPath[this.rawFlightPath.length - 2] || this.origin, this.destination);
        }
    }

    // --- BEZIER HELPERS ---

    // Cubic Bezier interpolation
    // p0: Start, p1, p2: Controls, p3: End
    // Returns {lat, lon}
    calculateCubicBezierPoint(t, p0, p1, p2, p3) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        // Simple lat/lon interpolation (approximate for short distances)
        // For larger distances on globe, this is slightly inaccurate but fine for STARs (<50nm)
        const lat = uuu * p0.lat + 3 * uu * t * p1.lat + 3 * u * tt * p2.lat + ttt * p3.lat;
        const lon = uuu * p0.lon + 3 * uu * t * p1.lon + 3 * u * tt * p2.lon + ttt * p3.lon;

        return { lat, lon };
    }

    // --- PROCEDURAL GENERATORS ---

    generateUnifiedPath() {
        this.fullPath = [];

        // --- 1. TAKEOFF & INITIAL CLIMB ---
        const takeoffPoints = this.generateTakeoffSegment();
        this.fullPath.push(...takeoffPoints);
        const startOfSID = takeoffPoints[takeoffPoints.length - 1];

        // --- 2. SID (Departure Procedure) ---
        // Turn from Runway Heading -> Enroute Heading
        const sidTargetAlt = Math.min(this.cruiseAltitude, AIRCRAFT_PARAMS.SID_ALTITUDE);
        const firstEnroute = this.rawFlightPath[1] || this.destination;
        const sidPoints = this.generateDepartureProc(startOfSID, sidTargetAlt, firstEnroute);
        this.fullPath.push(...sidPoints);
        const endOfSID = sidPoints.length > 0 ? sidPoints[sidPoints.length - 1] : startOfSID;

        // --- 4. STAR & APPROACH (Generate then reverse order) ---
        // Final Approach (Straight in to runway)
        const approachPoints = this.generateFinalApproach();

        // STAR (Arrival Procedure)
        // Curves from Arrival Direction -> Approach Alignment
        const starStartAlt = Math.min(this.cruiseAltitude, AIRCRAFT_PARAMS.STAR_ENTRY_ALTITUDE);
        const startOfApproach = approachPoints[0]; // Intercept point

        // Determine arrival direction from LAST enroute point
        const lastEnroute = this.rawFlightPath[this.rawFlightPath.length - 2] || this.origin;
        const starPoints = this.generateArrivalProc(startOfApproach, starStartAlt, lastEnroute);

        // Combine: STAR -> Approach
        // We trim the first point of approachPoints to strictly avoid duplicate Intercept point if they match exactly
        const arrivalPath = [...starPoints, ...approachPoints.slice(1)];
        const startOfSTAR = arrivalPath.length > 0 ? arrivalPath[0] : null;

        // --- 3. CRUISE (Great Circle) ---
        if (startOfSTAR) {
            const cruisePoints = this.generateCruiseSegment(endOfSID, startOfSTAR);
            this.fullPath.push(...cruisePoints);
            this.fullPath.push(...arrivalPath);
        }

        // --- 5. RECALCULATE DISTANCES ---
        // Critical step: Ensure distances are strictly increasing from 0
        let cumulativeDist = 0;
        if (this.fullPath.length > 0) {
            this.fullPath[0].dist = 0;
        }

        for (let i = 0; i < this.fullPath.length - 1; i++) {
            const p1 = this.fullPath[i];
            const p2 = this.fullPath[i + 1];
            const legDist = this.calculateDistance(p1, p2);
            cumulativeDist += legDist;
            p2.dist = cumulativeDist;
        }

        // Calculate total path distance for normalization
        this.pathTotalDistance = cumulativeDist;
    }

    generateTakeoffSegment() {
        const points = [];
        const runwayLen = AIRCRAFT_PARAMS.TAKEOFF_ROLL; // nm
        const initialClimbLen = AIRCRAFT_PARAMS.INITIAL_CLIMB; // nm

        // 0. Start
        points.push({
            lat: this.depThreshold.lat,
            lon: this.depThreshold.lon,
            alt: 0,
            speed: 0,
            phase: FLIGHT_PHASES.TAKEOFF_ROLL,
            dist: 0 // placeholder
        });

        // 1. Rotation Point
        const rotPoint = this.calculateDestinationPoint(this.depThreshold, this.depHeading, runwayLen * 0.8);
        points.push({
            ...rotPoint,
            alt: 0,
            speed: AIRCRAFT_PARAMS.VR,
            phase: FLIGHT_PHASES.ROTATE,
            dist: 0 // placeholder
        });

        // 2. Liftoff (End of Runway)
        const liftPoint = this.calculateDestinationPoint(this.depThreshold, this.depHeading, runwayLen);
        points.push({
            ...liftPoint,
            alt: 50,
            speed: AIRCRAFT_PARAMS.V2,
            phase: FLIGHT_PHASES.LIFTOFF,
            dist: 0 // placeholder
        });

        // 3. Initial Climb (Straight out)
        const climbEnd = this.calculateDestinationPoint(this.depThreshold, this.depHeading, runwayLen + initialClimbLen);
        points.push({
            ...climbEnd,
            alt: 1500, // Safe altitude
            speed: AIRCRAFT_PARAMS.VCLIMB,
            phase: FLIGHT_PHASES.INITIAL_CLIMB,
            dist: 0 // placeholder
        });

        return points;
    }

    generateDepartureProc(startPoint, targetAlt, enrouteTarget) {
        const points = [];
        const turnRate = 3; // deg/sec standard rate? No, let's use fixed radius for geometry.
        const turnRadius = 5; // nm
        const climbRate = 500; // ft/nm

        const altToGain = targetAlt - startPoint.alt;
        if (altToGain <= 0) return points;

        // 1. Calculate Turn Geometry
        const runwayHeading = this.depHeading;
        const enrouteBearing = this.calculateBearing(startPoint, enrouteTarget);

        let turnAngle = enrouteBearing - runwayHeading;
        if (turnAngle > 180) turnAngle -= 360;
        if (turnAngle < -180) turnAngle += 360;

        const absAngle = Math.abs(turnAngle);
        const isRightTurn = turnAngle > 0;
        const turnDir = isRightTurn ? 1 : -1;

        // 2. Decide Path Type
        // If small angle (< 10 deg), just fly straight/blend
        if (absAngle < 10) {
            // Straight climb towards enroute
            const distNeeded = altToGain / climbRate;
            const steps = 10;
            const dPerStep = distNeeded / steps;
            const aPerStep = altToGain / steps;

            let curr = { ...startPoint };
            // Linearly interpolate heading from Runway to Enroute over the climb? 
            // Or just snap to Enroute? A smooth blend is better.

            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const h = runwayHeading + turnAngle * t; // Linear heading change
                const nextPos = this.calculateDestinationPoint(curr, h, dPerStep);

                curr = {
                    lat: nextPos.lat,
                    lon: nextPos.lon,
                    alt: startPoint.alt + aPerStep * i,
                    speed: AIRCRAFT_PARAMS.VCLIMB,
                    phase: FLIGHT_PHASES.DEPARTURE_PROCEDURE,
                    dist: 0
                };
                points.push(curr);
            }
            return points;
        }

        // 3. Curved Path (Turn)
        // Arc length
        const turnDist = (Math.PI * 2 * turnRadius) * (absAngle / 360);

        // Altitude gained during turn
        // If turn is very short, we won't reach target altitude.
        // If turn is very long (spiral), we might overshoot? (Unlikely for SID altitude)
        const altGainedInTurn = turnDist * climbRate;
        const turnPoints = Math.max(10, Math.ceil(absAngle / 5)); // Point every 5 degrees

        const dAng = absAngle / turnPoints;
        const dDist = turnDist / turnPoints;
        const dAlt = altGainedInTurn / turnPoints;

        let currHeading = runwayHeading;
        let currLat = startPoint.lat;
        let currLon = startPoint.lon;
        let currAlt = startPoint.alt;

        // Generate Turn Points
        for (let i = 1; i <= turnPoints; i++) {
            currHeading = (currHeading + dAng * turnDir + 360) % 360;
            currAlt += dAlt;
            // Cap alt if we somehow climbed too fast (unlikely)
            if (currAlt > targetAlt) currAlt = targetAlt;

            const nextPos = this.calculateDestinationPoint({ lat: currLat, lon: currLon }, currHeading, dDist);
            currLat = nextPos.lat;
            currLon = nextPos.lon;

            points.push({
                lat: currLat,
                lon: currLon,
                alt: currAlt,
                speed: AIRCRAFT_PARAMS.VCLIMB,
                phase: FLIGHT_PHASES.DEPARTURE_PROCEDURE,
                dist: 0
            });
        }

        // 4. Straight Climb Leg (if needed)
        // If we haven't reached target altitude, fly straight on new heading
        if (currAlt < targetAlt) {
            const remainingAlt = targetAlt - currAlt;
            const remainingDist = remainingAlt / climbRate;
            // Add a straight segment
            const endPos = this.calculateDestinationPoint({ lat: currLat, lon: currLon }, currHeading, remainingDist);
            // Just one point at end is enough? Or intermediate?
            // Let's add intermediate for consistency
            const steps = Math.ceil(remainingDist / 2); // Every 2nm
            for (let i = 1; i <= steps; i++) {
                const frac = i / steps;
                const distStep = remainingDist * frac;
                const pos = this.calculateDestinationPoint({ lat: currLat, lon: currLon }, currHeading, distStep);

                points.push({
                    lat: pos.lat,
                    lon: pos.lon,
                    alt: currAlt + remainingAlt * frac,
                    speed: AIRCRAFT_PARAMS.VCLIMB,
                    phase: FLIGHT_PHASES.DEPARTURE_PROCEDURE,
                    dist: 0
                });
            }
        }

        return points;
    }

    generateFinalApproach() {
        const points = [];
        // Work BACKWARDS from threshold to intercept

        // Threshold
        const threshold = {
            lat: this.arrThreshold.lat,
            lon: this.arrThreshold.lon,
            alt: 50,
            speed: AIRCRAFT_PARAMS.VREF,
            phase: FLIGHT_PHASES.FINAL,
            dist: 0 // placeholder
        };

        // 3 Degree Glide Slope
        const nmToFt = 6076;
        const glideAngleRel = Math.tan(3 * Math.PI / 180);

        // Intercept Point (10nm out)
        const approachHeading = (this.arrHeading + 180) % 360; // Reciprocal of arrival heading? 
        // Wait. arrivalHeading is usually Runway heading.
        // We land ON the runway heading. 
        // We come from West.
        // To find point 10nm West, we move 10nm West (270).
        // 270 is Reciprocal of 090.
        // So yes, move distance 10nm along Reciprocal.
        const reciprocal = (this.arrHeading + 180) % 360;
        const dist = AIRCRAFT_PARAMS.FINAL_APPROACH; // 10nm

        const interceptAlt = (dist * nmToFt * glideAngleRel) + 50; // ~3200ft
        const interceptPos = this.calculateDestinationPoint(this.arrThreshold, reciprocal, dist);

        // We want the array to be: Intercept -> Threshold
        points.push({
            lat: interceptPos.lat,
            lon: interceptPos.lon,
            alt: interceptAlt,
            speed: AIRCRAFT_PARAMS.VAPPROACH,
            phase: FLIGHT_PHASES.FINAL,
            dist: 0 // placeholder
        });

        points.push(threshold);

        return points;
    }

    generateArrivalProc(interceptPoint, entryAlt, lastEnroutePoint) {
        const points = [];

        // 1. Determine Entry Point
        // We want to be roughly 40nm from the airport, coming FROM the enroute direction.
        // Arrival Heading = Bearing from LastEnroute -> Dest
        const arrivalBearing = this.calculateBearing(lastEnroutePoint, this.destination);
        const starDistance = 40; // nm

        // Entry point is 'starDistance' nm away from Dest on reciprocal of arrival bearing
        const entryPos = this.calculateDestinationPoint(this.destination, (arrivalBearing + 180) % 360, starDistance);

        // 2. Define Bezier Curve
        // P0 = Entry Point
        const p0 = { lat: entryPos.lat, lon: entryPos.lon };

        // P3 = Intercept Point
        const p3 = { lat: interceptPoint.lat, lon: interceptPoint.lon };

        // Control Points to ensure smooth tangents
        // P1: Project forward from Entry along Arrival Bearing
        // Control length: proportional to distance between P0 and P3
        const directDist = this.calculateDistance(p0, p3);
        const controlLen = directDist * 0.4; // 40% of distance

        const p1Raw = this.calculateDestinationPoint(entryPos, arrivalBearing, controlLen);
        const p1 = { lat: p1Raw.lat, lon: p1Raw.lon };

        // P2: Project backward from Intercept along Runway Heading (to align with final)
        const runwayHeading = this.arrHeading; // Final approach heading
        const reciprocalRunway = (runwayHeading + 180) % 360;

        const p2Raw = this.calculateDestinationPoint(interceptPoint, reciprocalRunway, controlLen);
        const p2 = { lat: p2Raw.lat, lon: p2Raw.lon };

        // 3. Sample The Curve
        const steps = 30;
        const entrySpeed = AIRCRAFT_PARAMS.VCRUISE;
        const exitSpeed = AIRCRAFT_PARAMS.VAPPROACH;
        const exitAlt = interceptPoint.alt;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const pos = this.calculateCubicBezierPoint(t, p0, p1, p2, p3);

            // Linear alt/speed interpolation
            const alt = entryAlt + (exitAlt - entryAlt) * t;
            const speed = entrySpeed + (exitSpeed - entrySpeed) * t;

            points.push({
                lat: pos.lat,
                lon: pos.lon,
                alt: alt,
                speed: speed,
                phase: FLIGHT_PHASES.ARRIVAL_PROCEDURE,
                dist: 0
            });
        }

        return points;
    }

    generateCruiseSegment(startPoint, endPoint) {
        // Simple Great Circle interpolation
        const points = [];
        const dist = this.calculateDistance(startPoint, endPoint);
        const steps = Math.ceil(dist / 50); // Waypoint every 50nm

        if (steps <= 0) return points;

        for (let i = 1; i < steps; i++) {
            const frac = i / steps;
            const pos = this.interpolateGreatCircle(startPoint, endPoint, frac);
            points.push({
                lat: pos.lat,
                lon: pos.lon,
                alt: this.cruiseAltitude,
                speed: AIRCRAFT_PARAMS.VCRUISE,
                phase: FLIGHT_PHASES.CRUISE,
                dist: 0 // placeholder
            });
        }

        return points;
    }

    // --- MAIN API ---

    calculateFlightState(progress, elapsedTime, deltaTime = 0.016) {
        if (!this.fullPath || this.fullPath.length === 0) return {};

        // 1. Find target distance
        const targetDist = progress * this.pathTotalDistance;

        // 2. Find path segment
        let p1 = this.fullPath[0];
        let p2 = this.fullPath[1];
        let found = false;

        for (let i = 0; i < this.fullPath.length - 1; i++) {
            if (targetDist >= this.fullPath[i].dist && targetDist <= this.fullPath[i + 1].dist) {
                p1 = this.fullPath[i];
                p2 = this.fullPath[i + 1];
                found = true;
                break;
            }
        }
        // If progress > 1 or floating point error, clamp to last segment
        if (!found && this.fullPath.length > 1) {
            p1 = this.fullPath[this.fullPath.length - 2];
            p2 = this.fullPath[this.fullPath.length - 1];
        }

        // 3. Interpolate
        const segmentLen = p2.dist - p1.dist;
        const segmentProgress = segmentLen <= 0 ? 0 : (targetDist - p1.dist) / segmentLen;

        const lat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
        const lon = p1.lon + (p2.lon - p1.lon) * segmentProgress;
        const alt = p1.alt + (p2.alt - p1.alt) * segmentProgress;
        const speed = p1.speed + (p2.speed - p1.speed) * segmentProgress;

        // Calculate heading
        const heading = this.calculateBearing(p1, p2);

        // Calculate pitch/bank
        const pitch = this.calculatePitch(p1.phase, alt, p2.alt);
        const bank = this.calculateBank(heading, deltaTime);

        this.lastHeading = heading;
        this.lastPitch = pitch;
        this.lastBank = bank;

        return {
            position: { lat, lon },
            altitude: alt,
            heading,
            speed,
            pitch,
            bank,
            phase: p1.phase
        };
    }

    generateFlightPath(numPoints = 500) {
        const path = [];
        // Sample the continuous path
        for (let i = 0; i <= numPoints; i++) {
            const progress = i / numPoints;
            const state = this.calculateFlightState(progress, 0);
            if (state && state.position) {
                path.push({
                    lat: state.position.lat,
                    lon: state.position.lon,
                    altitude: state.altitude // Fix: use 'altitude' not 'alt'
                });
            }
        }
        return path;
    }

    // --- HELPERS ---

    calculatePitch(phase, currentAlt, nextAlt) {
        // Simple pitch logic based on climb/descent
        const diff = nextAlt - currentAlt;
        if (diff > 0.5) return 5; // Climbing
        if (diff < -0.5) return -3; // Descending
        return 2; // Cruise/Level
    }

    calculateBank(targetHeading, deltaTime) {
        let diff = targetHeading - this.lastHeading;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Turn Rate (degrees per second)
        // If deltaTime is very small (first frame), assume 0 turn rate
        const turnRate = deltaTime > 0 ? diff / deltaTime : 0;

        // Calculate target bank angle based on turn rate
        // Standard rate turn (3 deg/sec) ~ 15-20 deg bank
        // Formula: tan(bank) = (V * omega) / g
        // Approximate linear mapping for stability: 3 deg/sec -> 20 deg bank
        const targetBank = Math.max(-30, Math.min(30, turnRate * 7));

        // Smoothly interpolate towards target bank
        // Use a simple low-pass filter / exponential moving average
        // bank = lerp(current, target, factor)
        // Adjust lerp factor based on deltaTime for consistent behavior
        const smoothFactor = 1.0 - Math.exp(-2.0 * deltaTime); // Adjust 2.0 for responsiveness

        const currentBank = this.lastBank || 0;
        const newBank = currentBank + (targetBank - currentBank) * smoothFactor;

        return newBank;
    }

    selectRunway(runways, pathPoint, isDeparture) {
        if (!runways || runways.length === 0) return null;
        return runways[0]; // Simplified: just pick first
    }

    calculateBearing(from, to) {
        const dLon = (to.lon - from.lon) * Math.PI / 180;
        const lat1 = from.lat * Math.PI / 180;
        const lat2 = to.lat * Math.PI / 180;

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        let heading = Math.atan2(y, x) * 180 / Math.PI;
        return (heading + 360) % 360;
    }

    calculateDestinationPoint(start, bearing, dist) {
        const R = 3440.065; // Earth radius in nautical miles
        const d = dist / R;
        const bearingRad = bearing * Math.PI / 180;
        const lat1 = start.lat * Math.PI / 180;
        const lon1 = start.lon * Math.PI / 180;

        const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(d) +
            Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad)
        );

        const lon2 = lon1 + Math.atan2(
            Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
            Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
        );

        return {
            lat: lat2 * 180 / Math.PI,
            lon: lon2 * 180 / Math.PI
        };
    }

    calculateDistance(p1, p2) {
        const R = 3440.065;
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lon - p1.lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    interpolateGreatCircle(p1, p2, f) {
        const d = this.calculateDistance(p1, p2) / 3440.065; // ang dist
        const lat1 = p1.lat * Math.PI / 180;
        const lon1 = p1.lon * Math.PI / 180;
        const lat2 = p2.lat * Math.PI / 180;
        const lon2 = p2.lon * Math.PI / 180;

        const a = Math.sin((1 - f) * d) / Math.sin(d);
        const b = Math.sin(f * d) / Math.sin(d);

        const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
        const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);

        const lat3 = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon3 = Math.atan2(y, x);

        return {
            lat: lat3 * 180 / Math.PI,
            lon: lon3 * 180 / Math.PI
        };
    }
}

export default FlightPhaseEngine;
