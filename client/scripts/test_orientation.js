import * as THREE from 'three';

// --- Test Utilities ---
function assertVector(name, actual, expected, tolerance = 0.001) {
    const dist = actual.distanceTo(expected);
    if (dist < tolerance) {
        console.log(`PASS: ${name}`);
        return true;
    } else {
        console.error(`FAIL: ${name}`);
        console.error(`  Actual:   (${actual.x.toFixed(3)}, ${actual.y.toFixed(3)}, ${actual.z.toFixed(3)})`);
        console.error(`  Expected: (${expected.x.toFixed(3)}, ${expected.y.toFixed(3)}, ${expected.z.toFixed(3)})`);
        console.error(`  Distance: ${dist}`);
        return false;
    }
}

function calculateOrientation(position, heading, pitch, bank) {
    // Math adapted directly from Scene3D.jsx fix
    const pos = position.clone().normalize();
    const upVector = pos.clone();

    const worldUp = new THREE.Vector3(0, 1, 0);
    const dotVal = upVector.dot(worldUp);
    const proj = upVector.clone().multiplyScalar(dotVal);
    const beforeNorm = worldUp.clone().sub(proj);
    if (heading === 0 && pitch === 0 && bank === 0) {
        console.log("DEBUG CALC (H=0):");
        console.log("  WorldUp:", worldUp);
        console.log("  UpVector:", upVector);
        console.log("  Dot:", dotVal);
        console.log("  Proj:", proj);
        console.log("  BeforeNorm:", beforeNorm);
    }
    let north = beforeNorm.normalize();

    if (north.lengthSq() < 0.001) {
        north = new THREE.Vector3(1, 0, 0);
    }

    // East = North x Up (RHS)
    const east = new THREE.Vector3().crossVectors(north, upVector).normalize();

    // Recalculate North
    // Recalculate North (Corrected: Up x East)
    north = new THREE.Vector3().crossVectors(upVector, east).normalize();

    // Forward calculation
    const headingRad = (heading || 0) * (Math.PI / 180);
    const forward = north.clone().multiplyScalar(Math.cos(headingRad))
        .add(east.clone().multiplyScalar(Math.sin(headingRad)));

    // Right = Forward x Up (RHS)
    const right = new THREE.Vector3().crossVectors(forward, upVector).normalize();

    if (heading === 0 && pitch === 0 && bank === 0) {
        console.log("DEBUG VECTORS (H=0, P=0):");
        console.log("Up:", upVector);
        console.log("North:", north);
        console.log("East:", east);
        console.log("Forward:", forward);
        console.log("Right:", right);
        console.log("BasisZ (-Forward):", forward.clone().negate());
    }

    // Basis
    // IMPORTANT: Scene3D uses rotMatrix.makeBasis(right, upVector, -forward)
    // because standard Three.js objects face -Z.
    // So if the aircraft nose is -Z, we want the basis Z axis (which points "back") 
    // to point in the direction of "-forward" (opposite to movement).
    // Wait...
    // Movement direction is 'forward'.
    // Object Front is -Z.
    // Object Back is +Z.
    // We want Object Front (-Z local) to align with Movement ('forward' world).
    // So -Z_local = Forward_world
    // => Z_local = -Forward_world
    // So the Basis Z vector should be -forward.

    const rotMatrix = new THREE.Matrix4().makeBasis(right, upVector, forward.clone().negate());
    const baseQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

    // Pitch (around Right, X axis)
    const pitchRad = (pitch || 0) * (Math.PI / 180);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRad);

    // Bank (around Forward, -Z axis... wait?)
    // In Scene3D: setFromAxisAngle(new THREE.Vector3(0, 0, -1), bankRad)
    // Rolling right (positive bank) should be clockwise looking forward?
    // Standard aerodynamic bank: right wing down is positive rotation around longitudinal axis.
    const bankRad = (bank || 0) * (Math.PI / 180);
    const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, -1), bankRad);

    return baseQuaternion.clone().multiply(pitchQuat).multiply(bankQuat);
}

// --- Transformations Check ---
function transformVector(v, q) {
    return v.clone().applyQuaternion(q);
}

console.log("=== Running Orientation Unit Tests ===\n");

// Test 1: Heading 0 (North) at Equator
{
    console.log("--- Test 1: Heading 0 (North) at Equator Lat/Lon(0,0) ---");
    const position = new THREE.Vector3(0, 0, 100); // Equator, Z=100 (Lat 0, Lon 0 -> X=0, Y=0, Z=100? No wait)
    // latLonToVector3(0,0):
    // x = r * cos(0) * sin(0) = 0
    // y = r * sin(0) = 0
    // z = r * cos(0) * cos(0) = 100
    // So (0, 0, 100) is correct.

    // At (0,0,100):
    // Up = (0,0,1)
    // WorldUp = (0,1,0)
    // North = WorldUp - (Up.dot(WorldUp))*Up = (0,1,0) - 0 = (0,1,0). Correct. Y is North.
    // East = North x Up = (0,1,0) x (0,0,1) = (1,0,0). Correct. X is East.
    // Heading 0 -> Forward = North = (0,1,0).
    // Right = Forward x Up = (0,1,0) x (0,0,1) = (1,0,0) = East. Correct.

    const q = calculateOrientation(position, 0, 0, 0); // H:0, P:0, B:0

    // If we take a generic aircraft model pointing -Z (Nose), applying q should make it point North (0,1,0).
    // Model Nose vector (Local): (0, 0, -1)
    const modelNose = new THREE.Vector3(0, 0, -1);
    const worldNose = transformVector(modelNose, q);

    assertVector("Nose points North", worldNose, new THREE.Vector3(0, 1, 0));
}

// Test 2: Heading 90 (East) at Equator
{
    console.log("\n--- Test 2: Heading 90 (East) at Equator ---");
    const position = new THREE.Vector3(0, 0, 100);
    const q = calculateOrientation(position, 90, 0, 0);

    // Forward should be East (1,0,0)
    // Model Nose (-Z) -> East (1,0,0)
    const modelNose = new THREE.Vector3(0, 0, -1);
    const worldNose = transformVector(modelNose, q);

    assertVector("Nose points East", worldNose, new THREE.Vector3(1, 0, 0));
}

// Test 3: Pitch Up 90 degrees (Vertical)
{
    console.log("\n--- Test 3: Pitch Up 90 deg (Vertical Climb) ---");
    const position = new THREE.Vector3(0, 0, 100);
    // Heading 0 (North), Pitch 90
    const q = calculateOrientation(position, 0, 90, 0);

    // Heading 0 -> Forward is North (0,1,0). Up is Z (0,0,1).
    // Pitching Up 90deg should make the nose point towards 'Up' (0,0,1) away from earth?
    // Wait, Pitch is around Right Axis.
    // Right = East (1,0,0).
    // Rotation around X axis by +90deg.
    // North (0,1,0) rotated +90 around X (1,0,0) -> Z (0,0,1)?
    // RHR around X: Y -> Z. Yes.
    // So Nose should point (0,0,1).

    const modelNose = new THREE.Vector3(0, 0, -1);
    const worldNose = transformVector(modelNose, q);

    assertVector("Nose points Up (Away from earth)", worldNose, new THREE.Vector3(0, 0, 1));
}

// Test 4: Pitch Up 90 degrees with Heading 90
{
    console.log("\n--- Test 4: Pitch Up 90 deg with Heading 90 (East) ---");
    const position = new THREE.Vector3(0, 0, 100);
    const q = calculateOrientation(position, 90, 90, 0);

    // Heading 90 -> Forward is East (1,0,0).
    // Up is (0,0,1).
    // Right = Forward x Up = (1,0,0) x (0,0,1) = (0,-1,0) -> South?
    // Wait. North(0,1,0), East(1,0,0). 
    // Forward=East(1,0,0). 
    // Right vector should be South (0,-1,0) if we are facing East?
    // Let's check: Forward(X) x Up(Z) = -Y. Correct. Right is South.

    // Pitch +90 around Right Axis (-Y).
    // Forward (X) rotated +90 around -Y.
    // RHR around -Y is same as LHR around Y.
    // Rotate X around -Y: X -> Z.
    // So Nose should point (0,0,1).

    const modelNose = new THREE.Vector3(0, 0, -1);
    const worldNose = transformVector(modelNose, q);

    assertVector("Nose points Up (Away from earth)", worldNose, new THREE.Vector3(0, 0, 1));
}

