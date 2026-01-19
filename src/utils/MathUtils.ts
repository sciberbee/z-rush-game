import * as THREE from 'three';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

// Generate positions for soldiers in a circular formation
export function getFormationPositions(count: number, spacing: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];

  if (count === 0) return positions;

  // Center soldier
  positions.push(new THREE.Vector3(0, 0, 0));

  if (count === 1) return positions;

  // Arrange in expanding rings
  let ring = 1;
  let placed = 1;

  while (placed < count) {
    const ringRadius = ring * spacing;
    const circumference = 2 * Math.PI * ringRadius;
    const soldiersInRing = Math.min(
      Math.floor(circumference / spacing),
      count - placed
    );

    for (let i = 0; i < soldiersInRing && placed < count; i++) {
      const angle = (i / soldiersInRing) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      positions.push(new THREE.Vector3(x, 0, z));
      placed++;
    }

    ring++;
  }

  return positions;
}

// Get direction to target
export function getDirection(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
  const direction = new THREE.Vector3();
  direction.subVectors(to, from);
  direction.y = 0;
  direction.normalize();
  return direction;
}

// Smoothly move towards target
export function moveTowards(
  current: THREE.Vector3,
  target: THREE.Vector3,
  maxDelta: number
): THREE.Vector3 {
  const direction = new THREE.Vector3();
  direction.subVectors(target, current);

  const distance = direction.length();

  if (distance <= maxDelta || distance === 0) {
    return target.clone();
  }

  direction.normalize();
  direction.multiplyScalar(maxDelta);

  return current.clone().add(direction);
}
