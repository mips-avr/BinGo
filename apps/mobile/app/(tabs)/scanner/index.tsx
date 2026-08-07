import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { ScanResult } from '../../../src/features/scanner';
import { analyzePhoto, classifyByRecyclingCode } from '../../../src/features/scanner';
import { Button } from '../../../src/components/ui/Button';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { colors, radius, spacing, shadow, touch, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

const RECYCLING_CODES = [1, 2, 3, 4, 5, 6, 7] as const;

export default function TrashScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const bottomInset = useBottomInset(spacing.md);

  function goToResult(result: ScanResult) {
    router.push({
      pathname: '/(tabs)/scanner/result',
      params: {
        materialType: result.materialType,
        source: result.source,
        confident: result.confident ? '1' : '0',
        visualScore: result.visualScore == null ? '' : String(result.visualScore),
        resinCode: result.resinCode == null ? '' : String(result.resinCode),
        disposalTip: result.disposalTip ?? '',
        pointsHint: String(result.pointsHint),
      },
    });
  }

  /**
   * Tahap 2 — dipakai hanya bila kode resin tidak terlihat.
   *
   * Kegagalan apa pun (kamera, dekode gambar) berhenti di sini sebagai galat.
   * Versi sebelumnya menangkap kegagalan lalu memanggil pengklasifikasi dengan
   * URI konstan `file:///fallback.jpg`, dan hasil hash dari nama berkas itu
   * ditampilkan ke pengguna sebagai hasil pemindaian sungguhan.
   */
  async function captureAndAnalyze() {
    setFailure(null);
    if (!cameraRef.current) {
      setFailure(t.scanner.captureFailedBody);
      return;
    }
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      if (!photo?.uri) {
        setFailure(t.scanner.captureFailedBody);
        return;
      }
      const result = await analyzePhoto(photo.uri);
      if (!result) {
        setFailure(t.scanner.captureFailedBody);
        return;
      }
      goToResult(result);
    } catch {
      setFailure(t.scanner.captureFailedBody);
    } finally {
      setScanning(false);
    }
  }

  function onManualCode(code: number) {
    setFailure(null);
    goToResult(classifyByRecyclingCode(code));
  }

  if (!permission) {
    return (
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.bingo700} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title={t.scanner.title} />
        <ScrollView contentContainerStyle={[s.permWrap, { paddingBottom: bottomInset }]}>
          <Text style={s.permText}>{t.scanner.permissionDenied}</Text>
          <Button label={t.common.retry} onPress={requestPermission} style={s.permBtn} />

          {/* Tahap 1 tidak membutuhkan kamera sama sekali. Menolak izin kamera
              tidak boleh berarti kehilangan seluruh fitur. */}
          <View style={s.manualBlock}>
            <Text style={s.manualTitle}>{t.scanner.manualCode}</Text>
            <Text style={s.manualHint}>{t.scanner.manualCodeHint}</Text>
            <View style={s.codeRow}>
              {RECYCLING_CODES.map((code) => (
                <CodeButton key={code} code={code} onPress={() => onManualCode(code)} />
              ))}
            </View>
          </View>
        </ScrollView>
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
            <ActivityIndicator
              color={colors.white}
              size="large"
              accessibilityLabel={t.scanner.analyzing}
            />
          ) : (
            <Button
              label={t.scanner.capture}
              variant="secondary"
              onPress={captureAndAnalyze}
              testID="scan-capture"
              style={s.captureBtn}
            />
          )}
        </View>
      </CameraView>

      <ScrollView
        style={s.bottomSheet}
        contentContainerStyle={[s.bottomSheetContent, { paddingBottom: bottomInset }]}
      >
        {failure ? (
          <ErrorState
            title={t.scanner.captureFailed}
            message={failure}
            onRetry={captureAndAnalyze}
            testID="scan-failure"
            style={s.failure}
          />
        ) : null}

        <Text style={s.manualTitle}>{t.scanner.manualCode}</Text>
        <Text style={s.manualHint}>{t.scanner.manualCodeHint}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.codeScroller}>
          {RECYCLING_CODES.map((code) => (
            <CodeButton key={code} code={code} onPress={() => onManualCode(code)} />
          ))}
        </ScrollView>

        {/* Pernyataan yang harus dibaca sebelum ada yang menyangka BinGo
            menjalankan model penglihatan komputer. */}
        <View style={s.noticeCard}>
          <Text style={s.noticeTitle}>{t.scanner.stageTitle}</Text>
          <Text style={s.noticeLine}>{t.scanner.stageOne}</Text>
          <Text style={s.noticeLine}>{t.scanner.stageTwo}</Text>
          <Text style={s.noticeStrong}>{t.scanner.noModelNotice}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CodeButton({ code, onPress }: { code: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t.scanner.manualCode} ${code}`}
      testID={`recycling-code-${code}`}
      style={({ pressed }) => [s.codeBtn, pressed ? s.codeBtnPressed : null]}
    >
      <Text style={s.codeBtnText}>{code}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo50,
  },
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  permWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permText: { textAlign: 'center', fontSize: 16, color: colors.neutral700 },
  permBtn: { marginTop: spacing.md },
  manualBlock: { marginTop: spacing.xxl },
  codeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  camSafe: { flex: 1, backgroundColor: colors.black },
  camOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    zIndex: 10,
    paddingHorizontal: spacing.md,
  },
  instructionText: { marginTop: spacing.xxs, ...typography.body, color: colors.whiteAlpha90 },
  camView: { flex: 1 },
  camBottomWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  scanFrame: {
    marginBottom: spacing.md,
    height: 160,
    width: 160,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.whiteAlpha80,
  },
  captureBtn: { alignSelf: 'stretch' },
  bottomSheet: {
    maxHeight: 300,
    backgroundColor: colors.bingo50,
  },
  bottomSheetContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  failure: { marginBottom: spacing.md },
  manualTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral900 },
  manualHint: { marginBottom: spacing.xs, ...typography.caption },
  codeScroller: { flexGrow: 0 },
  codeBtn: {
    marginRight: spacing.xs,
    height: touch.minTarget + 4,
    width: touch.minTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bingo600,
    ...shadow(1),
  },
  codeBtnPressed: { opacity: 0.75 },
  codeBtnText: { fontSize: 18, fontWeight: '700', color: colors.bingo700 },
  noticeCard: {
    marginTop: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.amber50,
    borderWidth: 1,
    borderColor: colors.amber100,
    padding: spacing.sm,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: colors.amber800 },
  noticeLine: { marginTop: spacing.xxs, fontSize: 12, color: colors.neutral700, lineHeight: 18 },
  noticeStrong: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber800,
    lineHeight: 18,
  },
});
