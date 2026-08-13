import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { isValidPhoneID } from '@bingo/shared-utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { extractApiErrorMessage } from '../../lib/api/client';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

interface FormErrors {
  phone?: string;
  password?: string;
}

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!isValidPhoneID(phone)) {
      next.phone = t.auth.errors.phoneInvalidExample;
    }
    if (password.length < 8) {
      next.password = t.auth.errors.passwordMin;
    }
    return next;
  }

  async function handleSubmit() {
    setSubmitError('');
    const issues = validate();
    setErrors(issues);
    if (Object.keys(issues).length > 0) return;

    try {
      await login({ phone, password });
      onSuccess?.();
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err, t.auth.loginFailed));
    }
  }

  return (
    <View>
      <Input
        label={t.auth.phone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        testID="login-phone"
      />
      <Input
        label={t.auth.password}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        testID="login-password"
        onSubmitEditing={handleSubmit}
      />
      {submitError ? (
        <View style={formS.errorBox} accessibilityLiveRegion="polite">
          <Text style={formS.errorTitle}>Masuk belum berhasil</Text>
          <Text style={formS.errorText}>{submitError}</Text>
        </View>
      ) : null}
      <Button
        label={t.auth.login}
        onPress={handleSubmit}
        loading={status === 'loading'}
        testID="login-submit"
        style={formS.submit}
      />
    </View>
  );
}

const formS = StyleSheet.create({
  submit: { marginTop: spacing.xs },
  errorBox: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.red500,
    backgroundColor: colors.red100,
  },
  errorTitle: { color: colors.red700, fontSize: 14, fontWeight: '800' },
  errorText: { marginTop: 2, color: colors.red700, fontSize: 13, lineHeight: 18 },
});
