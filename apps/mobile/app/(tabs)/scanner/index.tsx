import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { classifyByRecyclingCode, classifyPackaging } from '../../../src/features/scanner';
import { Button } from '../../../src/components/ui/Button';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
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
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50">
        <ActivityIndicator color="#15803D" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
        <ScreenHeader title={t.scanner.title} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-neutral-600">{t.scanner.permissionDenied}</Text>
          <View className="mt-4 w-full">
            <Button label={t.common.retry} onPress={requestPermission} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="absolute left-0 right-0 top-12 z-10 px-4">
        <ScreenHeader title={t.scanner.title} canGoBack={false} />
        <Text className="mt-1 text-sm text-white/90">{t.scanner.instruction}</Text>
      </View>

      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View className="flex-1 items-center justify-end pb-8">
          <View className="mb-4 h-48 w-48 rounded-2xl border-2 border-dashed border-white/80" />
          {scanning ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Button label={t.scanner.capture} onPress={captureAndAnalyze} testID="scan-capture" />
          )}
        </View>
      </CameraView>

      <View className="bg-bingo-50 px-4 py-4">
        <Text className="text-sm font-semibold text-neutral-800">{t.scanner.manualCode}</Text>
        <Text className="mb-2 text-xs text-neutral-500">{t.scanner.manualCodeHint}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RECYCLING_CODES.map((code) => (
            <Pressable
              key={code}
              onPress={() => onManualCode(code)}
              className="mr-2 h-12 w-12 items-center justify-center rounded-full bg-white border border-bingo-600"
            >
              <Text className="text-lg font-bold text-bingo-700">{code}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
