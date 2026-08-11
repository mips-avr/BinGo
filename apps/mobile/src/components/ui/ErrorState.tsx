import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * State galat dengan jalan keluar.
 *
 * Dipisahkan dari `EmptyState` supaya "belum ada data" dan "gagal memuat data"
 * tidak lagi terlihat sama — perbedaan itu menentukan apakah pengguna menunggu,
 * mencoba lagi, atau membuat data baru.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  testID,
  style,
}: ErrorStateProps) {
  return (
    <View
      style={[errorStyles.container, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <View style={errorStyles.iconCircle}>
        <Feather name="alert-triangle" size={22} color={colors.red600} />
      </View>
      <Text style={errorStyles.title}>{title ?? t.common.errorTitle}</Text>
      <Text style={errorStyles.message}>{message ?? t.common.errorMessage}</Text>
      {onRetry ? (
        <Button
          label={retryLabel ?? t.common.retry}
          variant="secondary"
          onPress={onRetry}
          testID={testID ? `${testID}-retry` : 'error-retry'}
          style={errorStyles.retry}
        />
      ) : null}
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.red100,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    height: 44,
    width: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red100,
  },
  title: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  message: {
    marginTop: spacing.xxs + 2,
    textAlign: 'center',
    ...typography.bodyMuted,
  },
  retry: {
    marginTop: spacing.md,
    minWidth: 180,
  },
});
