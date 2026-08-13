import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { SkeletonList } from '../ui/Skeleton';
import { colors, fonts, screenStyles, spacing } from '../../theme';
export function DataListView({
  title,
  subtitle,
  query,
  renderItems,
}: {
  title: string;
  subtitle: string;
  query: any;
  renderItems: (data: any) => React.ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching && !query.isLoading}
          onRefresh={() => query.refetch()}
          tintColor={colors.bingo700}
        />
      }
    >
      <Text style={screenStyles.screenTitle}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {query.isLoading ? (
        <SkeletonList count={5} />
      ) : query.isError ? (
        <ErrorState message="Data belum dapat dimuat" onRetry={() => query.refetch()} />
      ) : query.data ? (
        renderItems(query.data)
      ) : (
        <EmptyState title="Belum ada data" message="Data baru akan muncul di sini." />
      )}
    </ScrollView>
  );
}
export function DataCard({
  title,
  detail,
  meta,
  trailing,
  onPress,
}: {
  title: string;
  detail: string;
  meta?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const content = (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        {trailing}
      </View>
    </Card>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        hovered ? styles.cardHovered : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: {
    color: colors.neutral600,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  card: { marginBottom: spacing.sm },
  cardHovered: { transform: [{ translateY: -1 }], opacity: 0.96 },
  cardPressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 16, fontFamily: fonts.bold, color: colors.neutral900 },
  detail: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral600,
    fontFamily: fonts.regular,
  },
  meta: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.neutral500,
    fontFamily: fonts.regular,
  },
});
