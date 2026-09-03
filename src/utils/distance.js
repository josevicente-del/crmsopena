// src/utils/distance.js
// Utilidades para cálculo de distancia y rutas óptimas utilizando la API pública de OSRM.

/**
 * Calcula la distancia Haversine entre dos coordenadas (lat, lng) en kilómetros.
 * Esta función se mantiene por compatibilidad, aunque la distancia más corta
 * entre varios puntos se obtendrá mediante OSRM para obtener rutas reales por carretera.
 */
export function haversine(coord1, coord2) {
  const R = 6371; // Radio de la Tierra en km
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

/**
 * Llama al servicio OSRM (http://router.project-osrm.org) para obtener la ruta más corta
 * que visita todos los puntos (Traveling Salesman Problem) y devuelve la distancia total
 * en kilómetros y la geometría de la ruta como array de [lat, lng].
 *
 * @param {Array<Array<number>>} coords - Array de coordenadas [lat, lng].
 * @returns {Promise<{distance: number, geometry: Array<Array<number>>}>}
 */
export async function calculateShortestDistance(coords) {
  if (!Array.isArray(coords) || coords.length < 2) {
    return { distance: 0, geometry: [] };
  }
  // OSRM espera "lon,lat" y los separa por ';'
  const coordString = coords.map(c => `${c[1]},${c[0]}`).join(';');
  const url = `https://router.project-osrm.org/trip/v1/driving/${coordString}?source=first&roundtrip=false&overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.code !== 'Ok') {
    throw new Error(data.message || 'Error en la API OSRM');
  }
  const trip = data.trips[0];
  // distance viene en metros; la convertimos a km
  const distanceKm = trip.distance / 1000;
  // La geometría está en formato GeoJSON [lon, lat]
  const geometry = trip.geometry.coordinates.map(coord => [coord[1], coord[0]]);
  return { distance: distanceKm, geometry };
}

/**
 * Wrapper conveniente que combina ambos pasos: recibe prospectos con la propiedad
 * `location` (array [lat, lng]) y devuelve la distancia y la ruta.
 */
export async function calculateFromProspects(prospects) {
  const coords = prospects.map(p => p.location);
  return await calculateShortestDistance(coords);
}
