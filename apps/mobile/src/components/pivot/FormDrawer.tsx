import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { colors, fonts, radius, spacing } from '../../theme';

export function FormDrawer({
  visible,
  title,
  description,
  dirty = false,
  loading = false,
  submitLabel = 'Simpan',
  showSubmit = true,
  onClose,
  onSubmit,
  children,
}: {
  visible: boolean;
  title: string;
  description?: string;
  dirty?: boolean;
  loading?: boolean;
  submitLabel?: string;
  showSubmit?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const [closeHovered, setCloseHovered] = useState(false);
  function requestClose() {
    if (
      dirty &&
      Platform.OS === 'web' &&
      !globalThis.confirm('Buang perubahan yang belum disimpan?')
    )
      return;
    onClose();
  }

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const listener = (event: KeyboardEvent) => event.key === 'Escape' && requestClose();
    globalThis.addEventListener?.('keydown', listener);
    return () => globalThis.removeEventListener?.('keydown', listener);
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={requestClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Tutup formulir"
          style={styles.backdrop}
          onPress={requestClose}
        />
        <View style={styles.drawer} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              onPress={requestClose}
              onHoverIn={() => setCloseHovered(true)}
              onHoverOut={() => setCloseHovered(false)}
              style={({ pressed }) => [
                styles.close,
                closeHovered ? styles.closeHovered : null,
                pressed ? styles.closePressed : null,
              ]}
            >
              <Feather name="x" size={22} color={colors.neutral700} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={styles.footer}>
            <Button
              label="Batal"
              variant="ghost"
              onPress={requestClose}
              style={styles.footerButton}
            />
            {showSubmit ? (
              <Button
                label={submitLabel}
                loading={loading}
                onPress={onSubmit}
                style={styles.footerButton}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayDark },
  drawer: {
    width: Platform.OS === 'web' ? 520 : '92%',
    maxWidth: '100%',
    height: '100%',
    backgroundColor: colors.white,
    boxShadow: '-16px 0 48px rgba(0,0,0,0.16)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  title: { fontSize: 22, fontFamily: fonts.bold, color: colors.neutral900 },
  description: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.neutral600,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  closeHovered: { backgroundColor: colors.neutral100 },
  closePressed: { backgroundColor: colors.neutral200, transform: [{ scale: 0.94 }] },
  content: { padding: spacing.xl, paddingBottom: 80 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
  },
  footerButton: { minWidth: 120 },
});
