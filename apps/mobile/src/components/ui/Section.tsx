import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/screen';

export interface SectionProps {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.title}>{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button">
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
    marginBottom: 24,
  },
  header: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.bingo700,
  },
});
