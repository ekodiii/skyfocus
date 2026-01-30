import { useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMap } from 'react-map-gl';
import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import Aircraft from './Aircraft';
import useFlightStore from '../../store/flightStore';

// Component to handle the camera synchronization
function CameraSync() {
    const { current: map } = useMap();
    const { camera, scene } = useThree();

    // Create a model transform to convert lat/lon/alt to world matrix
    // This is how Mapbox Custom Layers work, but we are simulating it in a separate Canvas
    // We need to match the camera matrices exactly

    useFrame(() => {
        if (!map) return;

        // There are two ways to do this:
        // 1. Use mapbox-gl's CustomLayerInterface (best for depth interaction)
        // 2. Sync the Three.js camera to Mapbox's camera state (easier for R3F)

        // We'll use method 2 (Overlay) because it lets us keep our R3F component structure cleanly

        // Get Mapbox camera state
        const transform = map.transform;

        // In Mapbox Globe projection:
        // The world is not 0-1 or 0-mercator_size. It's a 3D globe.
        // map.getFreeCameraOptions() gives us the raw matrices!

        const freeCamera = map.getFreeCameraOptions();

        if (freeCamera && freeCamera.position && freeCamera.orientation) {
            // Copy projection matrix
            // Mapbox projection matrix is calculated internally
            // We can iterate the map's matrix
            // Actually, the easiest way to sync with Globe view is often to just use the
            // CustomLayerInterface pattern but wrapped in R3F.
        }
    });

    return null;
}

// Helper to convert Mercator coordinate to 3D position
function projectToWorld(lat, lon, alt) {
    // This logic depends heavily on whether we are in Mercator or Globe mode.
    // For Globe mode, we usually need mapbox-gl's projection helpers.
    return [0, 0, 0];
}

// Since syncing R3F camera to Mapbox Globe View manually is extremely math-heavy and prone to breaking
// with updates, the industry standard is to create a custom mapbox layer that *owns* the Three.js context
// or shares it.
//
// However, react-map-gl doesn't trivially wrap Custom Layers as React components.
//
// Let's try the "Overlay Canvas" with matrix sync first. If that fails, we fallback to CustomLayer.
// 
// For Globe view specifically, Mapbox calculates view matrices that include the globe curvature.
// Replicating this in Three.js without using Mapbox's matrix is hard.
//
// BUT, `map.transform.customLayerMatrix()` exists!
// It returns the matrix to multiply with your model matrix.
// 
// Actually, let's look at `mapbox-gl` examples for "add 3d model".
// They use `map.addLayer({ type: 'custom', render: ... })`.
// Inside `render(gl, matrix)`, `matrix` is the ViewProjection matrix!
//
// We can pass this `matrix` to our Three.js camera? 
// Yes, `camera.projectionMatrix.elements = matrix` and `camera.matrixWorldInverse.identity()`.
// This forces the Three.js scene to render exactly using Mapbox's viewpoint.

export default function MapboxAircraftLayer() {
    const { current: map } = useMap();
    const { position, altitude, flightPath, heading, pitch, bank } = useFlightStore();

    // We need to re-render the R3F scene whenever Mapbox renders.
    // And we need access to the `matrix` passed by Mapbox's render loop.
    // This suggests we REALLY should use a true Custom Layer, not an overlay Canvas.
    // An overlay Canvas (DOM element on top) won't have the correct depth buffering against the earth
    // (the plane would always be on top or behind everything depending on Z-index),
    // AND syncing the perspective perfectly is hard.
    //
    // CHANGE OF PLAN: We will implement a `CustomLayer` class that we add to the map.
    // To keep using R3F `Aircraft` component is tricky because R3F expects to own the loop.
    //
    // Hybrid approach:
    // Render `Aircraft` in a hidden R3F canvas to get the geometry/materials? No, too slow.
    //
    // Pure Three.js approach for the layer:
    // We can instantiate the `Aircraft` meshes using vanilla Three.js inside the custom layer.
    // Since `Aircraft.jsx` was mostly just OBJ loading and simple meshes, we can port it to a vanilla class.
    // 
    // OR: We can use `react-three/fiber` `render` with a `gl` target?
    //
    // Let's try the vanilla Custom Layer approach first as it's the most robust for Mapbox integration.
    // We will need to re-implement the "Aircraft" visual in vanilla JS or load the same model.

    // Wait, `Aircraft.jsx` has a procedural 737/787 composed of primitives. Re-writing that in vanilla
    // is tedious.
    //
    // Alternative: Use an Overlay with `map.getFreeCameraOptions()`?
    // With `projection: 'globe'`, `map.transform` provides methods to convert lat/lan/alt to 3D Cartesian coordinates
    // compatible with the camera.

    return null; // Placeholder as I switch to refactoring Scene3D to use the CustomLayer pattern logic
}
