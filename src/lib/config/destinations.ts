import * as THREE from 'three';

export interface Destination {
  key: string;
  name: string;
  lat: number;
  lon: number;
}

export const ORIGIN_DESTINATION: Destination = {
  key: 'baku',
  name: 'Baku',
  lat: 40.4,
  lon: 49.87,
};

export const DESTINATIONS: Destination[] = [
  { key: 'london', name: 'London', lat: 51.5, lon: -0.13 },
  { key: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.4 },
  { key: 'toronto', name: 'Toronto', lat: 43.65, lon: -79.38 },
  { key: 'sydney', name: 'Sydney', lat: -33.87, lon: 151.21 },
  { key: 'amsterdam', name: 'Amsterdam', lat: 52.37, lon: 4.9 },
];

/**
 * Converts latitude and longitude coordinates to a 3D position vector on a sphere.
 * @param lat Latitude in degrees
 * @param lon Longitude in degrees
 * @param radius Globe sphere radius
 */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}
