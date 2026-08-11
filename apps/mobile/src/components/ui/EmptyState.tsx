import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, spacing, typography } from '../../theme';

type FeatherIconName = keyof typeof Feather.glyphMap;

export interface EmptyStateProps {
  title: string;
  message?: string;
  /**
   * Emoji (mis. `"🌱"`) atau nama ikon Feather (mis. `"truck"`). Nama Feather
   * dirender sebagai ikon; selain itu dirender apa adanya sebagai teks.
   */
  icon?: string;
  /** Ajakan tindakan opsional, mis. "Buat permintaan". */
  action?: { label: string; onPress: () => void; testID?: string };
}

/** Nama Feather valid dirender sebagai ikon, bukan sebagai tulisan "truck". */
function isFeatherIcon(name: string): name is FeatherIconName {
  const glyphs: Record<string, unknown> = Feather.glyphMap ?? {};
  return Object.prototype.hasOwnProperty.call(glyphs, name);
}

/**
 * State kosong yang ramah.
 *
 * Dulu prop `icon` selalu masuk ke dalam `<Text>`, sehingga pemanggil yang
 * mengirim nama ikon (`icon="truck"`) benar-benar menampilkan tulisan "truck"
 * setinggi 48px di beranda warga.
 */
export function EmptyState({ title, message, icon = '🌱', action }: EmptyStateProps) {
  return (
    <View style={emptyStyles.container} accessibilityRole="summary">
      {isFeatherIcon(icon) ? (
        <Feather name={icon} size={40} color={colors.neutral400} />
      ) : (
        <Text style={emptyStyles.icon}>{icon}</Text>
      )}
      <Text style={emptyStyles.title}>{title}</Text>
      {message ? <Text style={emptyStyles.message}>{message}</Text> : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          testID={action.testID}
          style={emptyStyles.action}
        />
      ) : null}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl + spacing.xs,
  },
  icon: {
    fontSize: 44,
  },
  title: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral800,
  },
  message: {
    marginTop: spacing.xxs + 2,
    textAlign: 'center',
    ...typography.bodyMuted,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
