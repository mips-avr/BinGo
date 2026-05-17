import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, shadow } from '../../theme/screen';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  trailing?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, canGoBack = true, trailing }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.leading}>
        {canGoBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            style={headerStyles.backBtn}
          >
            <Text style={headerStyles.backIcon}>‹</Text>
          </Pressable>
        ) : null}
        <View style={headerStyles.titleWrap}>
          <Text style={headerStyles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={headerStyles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ? <View style={headerStyles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    ...shadow(1),
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.bingo700,
    marginTop: -2,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral600,
    marginTop: 2,
  },
  trailing: {
    marginLeft: 12,
  },
});
