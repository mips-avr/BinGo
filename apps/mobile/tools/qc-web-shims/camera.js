// Shim khusus QC (web): container tidak punya kamera, jadi pratinjau diganti
// bidang gelap agar kerangka layar TrashScan tetap dapat ditinjau.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CameraView = React.forwardRef(function CameraView(props, ref) {
  React.useImperativeHandle(ref, () => ({
    takePictureAsync: async () => ({ uri: 'file:///qc/sample.jpg', width: 1080, height: 1440 }),
  }));
  return (
    <View style={[styles.root, props.style]}>
      <Text style={styles.label}>Pratinjau kamera</Text>
      <Text style={styles.sub}>(mode QC — kamera tidak tersedia di browser)</Text>
      {props.children}
    </View>
  );
});

export function useCameraPermissions() {
  return [{ granted: true, canAskAgain: true, status: 'granted' }, async () => ({ granted: true })];
}
export const Camera = CameraView;
const styles = StyleSheet.create({
  root: { backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#E5E7EB', fontSize: 15, fontWeight: '700' },
  sub: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});
export default { CameraView, useCameraPermissions };
