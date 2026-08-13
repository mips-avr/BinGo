import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, shadow, spacing } from '../../theme';

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={cancelLabel} />
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} style={styles.action} />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={[styles.action, destructive ? styles.destructive : null]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.overlayDark },
  dialog: { width: '100%', maxWidth: 440, borderRadius: radius.lg, padding: spacing.xl, backgroundColor: colors.white, ...shadow(5) },
  title: { color: colors.neutral900, fontSize: 20, fontWeight: '800' },
  message: { marginTop: spacing.sm, color: colors.neutral600, fontSize: 14, lineHeight: 21 },
  actions: { marginTop: spacing.xl, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' },
  action: { minWidth: 120 },
  destructive: { backgroundColor: colors.red600 },
});
