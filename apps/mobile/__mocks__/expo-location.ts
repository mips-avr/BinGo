export const PermissionStatus = { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' } as const;
export const Accuracy = { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5 } as const;

export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: PermissionStatus.GRANTED,
}));

export const getCurrentPositionAsync = jest.fn(async () => ({
  coords: { latitude: -6.1944, longitude: 106.8229, accuracy: 10 },
}));

export const reverseGeocodeAsync = jest.fn(async () => [
  { street: 'Jl. MH Thamrin', subregion: 'Jakarta Pusat', city: 'Jakarta', region: 'DKI Jakarta' },
]);
