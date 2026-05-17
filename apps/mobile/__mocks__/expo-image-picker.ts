export const MediaTypeOptions = { Images: 'Images', Videos: 'Videos', All: 'All' } as const;

export const requestCameraPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));
export const requestMediaLibraryPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));

export const launchCameraAsync = jest.fn(async () => ({
  canceled: false,
  assets: [{ uri: 'file:///tmp/photo.jpg', width: 800, height: 600, mimeType: 'image/jpeg' }],
}));

export const launchImageLibraryAsync = jest.fn(async () => ({
  canceled: false,
  assets: [{ uri: 'file:///tmp/photo.jpg', width: 800, height: 600, mimeType: 'image/jpeg' }],
}));
