import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string | null;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, testID, ...rest }, ref) => {
    return (
      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium text-neutral-700">{label}</Text>
        <TextInput
          ref={ref}
          testID={testID}
          placeholderTextColor="#9CA3AF"
          className={`rounded-xl border bg-white px-4 py-3 text-base text-neutral-900 ${
            error ? 'border-red-500' : 'border-neutral-300'
          }`}
          {...rest}
        />
        {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';
