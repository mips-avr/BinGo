import { useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Input } from '../ui/Input';
import { SkeletonList } from '../ui/Skeleton';
import { colors, fonts, radius, spacing } from '../../theme';

export interface ManagementColumn<T> {
  key: string;
  label: string;
  width?: number;
  render: (item: T) => React.ReactNode;
}

export function ManagementPage<T extends { id: string }>({
  title,
  subtitle,
  primaryAction,
  query,
  items,
  columns,
  search,
  onSearchChange,
  archived,
  onArchivedChange,
  onEdit,
  onArchive,
  onRestore,
  onOpen,
  renderActions,
  pagination,
  showArchiveFilter = true,
  secondaryActions = [],
  canEdit = () => true,
  canArchive = () => true,
  canOpen = () => true,
}: {
  title: string;
  subtitle: string;
  primaryAction?: { label: string; onPress: () => void };
  query: { isLoading: boolean; isError: boolean; isFetching: boolean; refetch: () => unknown };
  items: T[];
  columns: ManagementColumn<T>[];
  search: string;
  onSearchChange: (value: string) => void;
  archived: boolean;
  onArchivedChange: (value: boolean) => void;
  onEdit?: (item: T) => void;
  onArchive?: (item: T) => void;
  onRestore?: (item: T) => void;
  onOpen?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  showArchiveFilter?: boolean;
  secondaryActions?: { label: string; onPress: () => void }[];
  canEdit?: (item: T) => boolean;
  canArchive?: (item: T) => boolean;
  canOpen?: (item: T) => boolean;
}) {
  const showActions = Boolean(renderActions || onOpen || onEdit || onArchive || onRestore);
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
      <View style={styles.pageHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          {secondaryActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="secondary"
              label={action.label}
              onPress={action.onPress}
            />
          ))}
          {primaryAction ? (
            <Button label={primaryAction.label} onPress={primaryAction.onPress} />
          ) : null}
        </View>
      </View>
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Input
            label="Cari"
            value={search}
            onChangeText={onSearchChange}
            placeholder={`Cari ${title.toLowerCase()}`}
          />
        </View>
        {showArchiveFilter ? (
          <View style={styles.filters}>
            <Button
              size="sm"
              label="Aktif"
              variant={!archived ? 'primary' : 'secondary'}
              onPress={() => onArchivedChange(false)}
            />
            <Button
              size="sm"
              label="Diarsipkan"
              variant={archived ? 'primary' : 'secondary'}
              onPress={() => onArchivedChange(true)}
            />
          </View>
        ) : null}
      </View>
      {query.isLoading ? (
        <SkeletonList count={6} />
      ) : query.isError ? (
        <ErrorState message="Data belum dapat dimuat" onRetry={() => query.refetch()} />
      ) : !items.length ? (
        <EmptyState
          title={`Belum ada ${title.toLowerCase()}`}
          message={
            archived
              ? 'Belum ada data yang diarsipkan.'
              : 'Gunakan tombol tindakan untuk menambahkan data pertama.'
          }
        />
      ) : (
        <View style={styles.table}>
          {Platform.OS === 'web' ? (
            <View style={styles.tableHeader}>
              {columns.map((column) => (
                <Text
                  key={column.key}
                  style={[styles.headerCell, column.width ? { flexBasis: column.width } : null]}
                >
                  {column.label}
                </Text>
              ))}
              {showActions ? (
                <Text style={[styles.headerCell, styles.actionColumn]}>Tindakan</Text>
              ) : null}
            </View>
          ) : null}
          {items.map((item) => (
            <ManagementRow
              key={item.id}
              item={item}
              columns={columns}
              archived={archived}
              onEdit={onEdit}
              onArchive={onArchive}
              onRestore={onRestore}
              onOpen={onOpen}
              renderActions={renderActions}
              canEdit={canEdit(item)}
              canArchive={canArchive(item)}
              canOpen={canOpen(item)}
              showActions={showActions}
            />
          ))}
        </View>
      )}
      {pagination && pagination.total > pagination.pageSize ? (
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>
            Halaman {pagination.page} dari {Math.ceil(pagination.total / pagination.pageSize)}
          </Text>
          <View style={styles.paginationActions}>
            <Button
              size="sm"
              label="Sebelumnya"
              variant="secondary"
              disabled={pagination.page <= 1}
              onPress={() => pagination.onPageChange(pagination.page - 1)}
            />
            <Button
              size="sm"
              label="Berikutnya"
              variant="secondary"
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              onPress={() => pagination.onPageChange(pagination.page + 1)}
            />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function ManagementRow<T extends { id: string }>({
  item,
  columns,
  archived,
  onEdit,
  onArchive,
  onRestore,
  onOpen,
  renderActions,
  canEdit,
  canArchive,
  canOpen,
  showActions,
}: {
  item: T;
  columns: ManagementColumn<T>[];
  archived: boolean;
  onEdit?: (item: T) => void;
  onArchive?: (item: T) => void;
  onRestore?: (item: T) => void;
  onOpen?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
  canEdit: boolean;
  canArchive: boolean;
  canOpen: boolean;
  showActions: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={() => canOpen && onOpen?.(item)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.row, hovered ? styles.rowHovered : null]}
    >
      {columns.map((column) => (
        <View
          key={column.key}
          style={[styles.cell, column.width ? { flexBasis: column.width } : null]}
        >
          {Platform.OS !== 'web' ? <Text style={styles.mobileLabel}>{column.label}</Text> : null}
          {column.render(item)}
        </View>
      ))}
      {showActions ? (
        <View style={[styles.cell, styles.actionColumn, styles.actions]}>
          {renderActions?.(item)}
          {onOpen && canOpen ? (
            <Action icon="eye" label="Buka" onPress={() => onOpen(item)} />
          ) : null}
          {!archived && onEdit && canEdit ? (
            <Action icon="edit-2" label="Edit" onPress={() => onEdit(item)} />
          ) : null}
          {!archived && onArchive && canArchive ? (
            <Action icon="archive" label="Arsipkan" onPress={() => onArchive(item)} />
          ) : null}
          {archived && onRestore ? (
            <Action icon="rotate-ccw" label="Pulihkan" onPress={() => onRestore(item)} />
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={({ pressed }) => [
        styles.action,
        hovered ? styles.actionHovered : null,
        focused ? styles.actionFocused : null,
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Feather name={icon} size={16} color={colors.bingo700} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: 100,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerCopy: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  title: { fontSize: 25, fontFamily: fonts.bold, color: colors.neutral900 },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.neutral600,
  },
  toolbar: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'stretch',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  search: { flex: 1, maxWidth: Platform.OS === 'web' ? 420 : undefined },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: 14 },
  table: {
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.neutral100,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    alignItems: 'center',
    gap: spacing.md,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.neutral600,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    minHeight: 66,
    padding: spacing.md,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    gap: Platform.OS === 'web' ? spacing.md : spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    cursor: 'pointer',
  },
  rowHovered: { backgroundColor: colors.bingo50 },
  cell: { flex: 1, minWidth: 0 },
  mobileLabel: {
    marginBottom: 2,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.neutral500,
    textTransform: 'uppercase',
  },
  actionColumn: { flexGrow: 0, flexBasis: 190 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs },
  action: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo100,
    cursor: 'pointer',
  },
  actionHovered: { backgroundColor: colors.bingo200, transform: [{ translateY: -1 }] },
  actionFocused: { boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.22)' },
  actionPressed: { backgroundColor: colors.bingo200, opacity: 0.82, transform: [{ scale: 0.94 }] },
  pagination: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  paginationText: { fontSize: 13, fontFamily: fonts.regular, color: colors.neutral600 },
  paginationActions: { flexDirection: 'row', gap: spacing.sm },
});
