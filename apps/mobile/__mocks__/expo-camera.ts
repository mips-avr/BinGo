import { View } from 'react-native';

export const CameraView = View;
export const useCameraPermissions = jest.fn(() => [
  { granted: true, canAskAgain: true },
  jest.fn().mockResolvedValue({ granted: true }),
]);
