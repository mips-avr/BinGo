import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/screen';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
}

/** State kosong yang ramah — StyleSheet eksplisit agar teks terbaca. */
export function EmptyState({ title, message, icon = '🌱' }: EmptyStateProps) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={emptyStyles.title}>{title}</Text>
      {message ? <Text style={emptyStyles.message}>{message}</Text> : null}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral800,
  },
  message: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    color: colors.neutral600,
    lineHeight: 20,
  },
});
