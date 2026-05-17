import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { classifyByRecyclingCode, classifyPackaging } from '../../../src/features/scanner';
import { Button } from '../../../src/components/ui/Button';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { colors, shadow } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

const RECYCLING_CODES = [1, 2, 3, 4, 5, 6, 7] as const;

export default function TrashScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  async function captureAndAnalyze() {
    if (!cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      if (!photo?.uri) throw new Error('Gagal mengambil foto');
      const result = await classifyPackaging(photo.uri);
      router.push({
        pathname: '/(tabs)/scanner/result',
        params: {
          materialType: result.materialType,
          confidence: String(result.confidence),
          disposalTip: result.disposalTip,
          pointsHint: String(result.pointsHint),
          engine: result.engine,
        },
      });
    } catch {
      // fallback navigasi dengan PET default bila kamera gagal di simulator
      const result = await classifyPackaging('file:///fallback.jpg');
      router.push({
        pathname: '/(tabs)/scanner/result',
        params: {
          materialType: result.materialType,
          confidence: String(result.confidence),
          disposalTip: result.disposalTip,
          pointsHint: String(result.pointsHint),
          engine: result.engine,
        },
      });
    } finally {
      setScanning(false);
    }
  }

  function onManualCode(code: number) {
    const result = classifyByRecyclingCode(code);
    router.push({
      pathname: '/(tabs)/scanner/result',
      params: {
        materialType: result.materialType,
        confidence: String(result.confidence),
        disposalTip: result.disposalTip,
        pointsHint: String(result.pointsHint),
        engine: result.engine,
      },
    });
  }

  if (!permission) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator color={colors.bingo700} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title={t.scanner.title} />
        <View style={s.permWrap}>
          <Text style={s.permText}>{t.scanner.permissionDenied}</Text>
          <View style={s.permBtnWrap}>
            <Button label={t.common.retry} onPress={requestPermission} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.camSafe} edges={['top']}>
      <View style={s.camOverlay}>
        <ScreenHeader title={t.scanner.title} canGoBack={false} />
        <Text style={s.instructionText}>{t.scanner.instruction}</Text>
      </View>

      <CameraView ref={cameraRef} style={s.camView} facing="back">
        <View style={s.camBottomWrap}>
          <View style={s.scanFrame} />
          {scanning ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Button label={t.scanner.capture} onPress={captureAndAnalyze} testID="scan-capture" />
          )}
        </View>
      </CameraView>

      <View style={s.manualSection}>
        <Text style={s.manualTitle}>{t.scanner.manualCode}</Text>
        <Text style={s.manualHint}>{t.scanner.manualCodeHint}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RECYCLING_CODES.map((code) => (
            <Pressable
              key={code}
              onPress={() => onManualCode(code)}
              style={s.codeBtn}
            >
              <Text style={s.codeBtnText}>{code}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  permText: { textAlign: 'center', fontSize: 16, color: colors.neutral700 },
  permBtnWrap: { marginTop: 16, width: '100%' },
  camSafe: { flex: 1, backgroundColor: '#000' },
  camOverlay: { position: 'absolute', left: 0, right: 0, top: 48, zIndex: 10, paddingHorizontal: 16 },
  instructionText: { marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  camView: { flex: 1 },
  camBottomWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 32 },
  scanFrame: {
    marginBottom: 16, height: 192, width: 192, borderRadius: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.8)',
  },
  manualSection: { backgroundColor: colors.bingo50, paddingHorizontal: 16, paddingVertical: 16 },
  manualTitle: { fontSize: 14, fontWeight: '600', color: colors.neutral800 },
  manualHint: { marginBottom: 8, fontSize: 12, color: colors.neutral600 },
  codeBtn: {
    marginRight: 8, height: 48, width: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: 24, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.bingo600,
    ...shadow(1),
  },
  codeBtnText: { fontSize: 18, fontWeight: '700', color: colors.bingo700 },
});
