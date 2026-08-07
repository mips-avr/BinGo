import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface KeyboardAvoiderProps {
  children: React.ReactNode;
  /** Tinggi elemen di atas area yang dihindarkan (mis. header layar). */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pembungkus penghindar papan ketik untuk seluruh formulir.
 *
 * `behavior` pada Android sebelumnya diisi `undefined`, yang membuat
 * `KeyboardAvoidingView` tidak melakukan apa pun di sana — persis platform yang
 * paling banyak dipakai pengguna BinGo. `height` adalah perilaku yang benar
 * untuk Android; iOS tetap memakai `padding`.
 */
export function KeyboardAvoider({ children, offset = 0, style }: KeyboardAvoiderProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
