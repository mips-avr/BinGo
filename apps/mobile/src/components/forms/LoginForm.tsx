import { useState } from 'react';
import { Alert, View } from 'react-native';
import { isValidPhoneID } from '@bingo/shared-utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { extractApiErrorMessage } from '../../lib/api/client';
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

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!isValidPhoneID(phone)) {
      next.phone = 'Nomor telepon tidak valid (contoh: 08123456789)';
    }
    if (password.length < 8) {
      next.password = 'Kata sandi minimal 8 karakter';
    }
    return next;
  }

  async function handleSubmit() {
    const issues = validate();
    setErrors(issues);
    if (Object.keys(issues).length > 0) return;

    try {
      await login({ phone, password });
      onSuccess?.();
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, 'Gagal masuk'));
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
      />
      <Button
        label={t.auth.login}
        onPress={handleSubmit}
        loading={status === 'loading'}
        testID="login-submit"
      />
    </View>
  );
}
