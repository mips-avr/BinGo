/**
 * Tipe umum yang dipakai lintas domain.
 */

/** Representasi koordinat WGS84 (lat/lng) sesuai konvensi PostGIS SRID 4326. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Bounding box geografis (untuk filter peta). */
export interface BoundingBox {
  southWest: LatLng;
  northEast: LatLng;
}

/** Bentuk respons API standar BinGo. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Bentuk pagination kursor-based. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}
