import { forwardRef, useId, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string | null;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, testID, accessibilityLabel, onFocus, onBlur, ...rest }, ref) => {
    const errorId = useId();
    const [focused, setFocused] = useState(false);
    return (
      <View style={inputStyles.wrap}>
        <Text style={inputStyles.label} nativeID={`${errorId}-label`}>
          {label}
        </Text>
        <TextInput
          ref={ref}
          testID={testID}
          placeholderTextColor={colors.neutral500}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityLabelledBy={`${errorId}-label`}
          // Galat diumumkan pembaca layar, bukan hanya diwarnai merah.
          accessibilityState={{ disabled: rest.editable === false }}
          accessibilityHint={error ?? undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            inputStyles.field,
            focused ? inputStyles.fieldFocused : null,
            error ? inputStyles.fieldError : null,
          ]}
          {...rest}
        />
        {error ? (
          <Text style={inputStyles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const inputStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    marginBottom: spacing.xxs + 2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral700,
  },
  field: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral300,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 50,
    color: colors.neutral900,
  },
  fieldError: { borderColor: colors.red500 },
  fieldFocused: { borderColor: colors.bingo600, borderWidth: 2 },
  error: { marginTop: spacing.xxs + 2, ...typography.error },
});
