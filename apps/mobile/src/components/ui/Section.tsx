import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface SectionProps {
  title: string;
  action?: { label: string; onPress: () => void; testID?: string };
  children: React.ReactNode;
}

/**
 * Judul bagian + aksi opsional di kanan.
 *
 * Beranda warga dan dashboard pemulung dulu menuliskan ulang komponen ini
 * secara lokal dengan ukuran huruf berbeda (17 vs 16); keduanya sekarang
 * memakai komponen ini agar tingkat judul konsisten.
 */
export function Section({ title, action, children }: SectionProps) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            testID={action.testID}
            hitSlop={spacing.xs}
            style={({ pressed }) => [
              sectionStyles.actionBtn,
              pressed ? sectionStyles.pressed : null,
            ]}
          >
            <Text style={sectionStyles.action}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.sectionTitle,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  actionBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: spacing.xs,
  },
  pressed: { opacity: 0.6 },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.bingo700,
  },
});
