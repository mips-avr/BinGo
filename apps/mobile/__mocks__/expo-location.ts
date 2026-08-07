export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;
export const Accuracy = { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5 } as const;

export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: PermissionStatus.GRANTED,
}));

export const getCurrentPositionAsync = jest.fn(async () => ({
  coords: { latitude: -6.1944, longitude: 106.8229, accuracy: 10 },
}));

/**
 * `watchPositionAsync` mengirim satu pembacaan langsung lalu mengembalikan
 * langganan yang bisa dilepas — cukup untuk meniru perilaku nyata tanpa timer
 * yang menggantung setelah tes selesai.
 */
export const watchPositionAsync = jest.fn(
  async (_options: unknown, callback: (position: unknown) => void) => {
    callback({ coords: { latitude: -6.1944, longitude: 106.8229, accuracy: 10 } });
    return { remove: jest.fn() };
  },
);

export const reverseGeocodeAsync = jest.fn(async () => [
  { street: 'Jl. MH Thamrin', subregion: 'Jakarta Pusat', city: 'Jakarta', region: 'DKI Jakarta' },
]);
