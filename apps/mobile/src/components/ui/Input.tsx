import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/screen';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string | null;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, testID, ...rest }, ref) => {
    return (
      <View style={inputStyles.wrap}>
        <Text style={inputStyles.label}>{label}</Text>
        <TextInput
          ref={ref}
          testID={testID}
          placeholderTextColor={colors.neutral500}
          style={[inputStyles.field, error ? inputStyles.fieldError : null]}
          {...rest}
        />
        {error ? <Text style={inputStyles.error}>{error}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const inputStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: '600', color: colors.neutral700 },
  field: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.neutral900,
  },
  fieldError: { borderColor: '#EF4444' },
  error: { marginTop: 6, fontSize: 12, color: colors.red600 },
});
