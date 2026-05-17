import { useState } from 'react';
import { Alert, View } from 'react-native';
import { isValidNIK, isValidPhoneID } from '@bingo/shared-utils';
import type { UserRole } from '@bingo/shared-types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { extractApiErrorMessage } from '../../lib/api/client';
import { t } from '../../i18n';

interface FormErrors {
  name?: string;
  phone?: string;
  password?: string;
  nik?: string;
}

export interface RegisterFormProps {
  role: UserRole;
  onSuccess?: () => void;
}

export function RegisterForm({ role, onSuccess }: RegisterFormProps) {
  const register = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nik, setNik] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = 'Nama minimal 2 karakter';
    if (!isValidPhoneID(phone)) next.phone = 'Nomor telepon tidak valid';
    if (password.length < 8) next.password = 'Kata sandi minimal 8 karakter';
    // NIK opsional untuk MSME, wajib untuk Warga & Pemulung.
    if (role !== 'MSME') {
      if (!isValidNIK(nik)) next.nik = 'NIK harus 16 digit angka yang valid';
    } else if (nik && !isValidNIK(nik)) {
      next.nik = 'NIK tidak valid';
    }
    return next;
  }

  async function handleSubmit() {
    const issues = validate();
    setErrors(issues);
    if (Object.keys(issues).length > 0) return;

    try {
      await register({
        name: name.trim(),
        phone,
        password,
        role,
        nik: nik.trim() || undefined,
      });
      onSuccess?.();
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, 'Gagal mendaftar'));
    }
  }

  return (
    <View>
      <Input
        label={t.auth.name}
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        error={errors.name}
        testID="register-name"
      />
      <Input
        label={t.auth.phone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        testID="register-phone"
      />
      <Input
        label={`${t.auth.nik}${role !== 'MSME' ? ' *' : ' (opsional)'}`}
        autoCapitalize="none"
        keyboardType="number-pad"
        maxLength={16}
        value={nik}
        onChangeText={setNik}
        error={errors.nik}
        testID="register-nik"
      />
      <Input
        label={t.auth.password}
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        testID="register-password"
      />
      <Button
        label={t.auth.register}
        onPress={handleSubmit}
        loading={status === 'loading'}
        testID="register-submit"
      />
    </View>
  );
}
