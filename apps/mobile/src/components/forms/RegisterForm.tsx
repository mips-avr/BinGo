import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { isValidPhoneID } from '@bingo/shared-utils';
import type { UserRole } from '@bingo/shared-types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { extractApiErrorMessage } from '../../lib/api/client';
import { spacing } from '../../theme';
import { t } from '../../i18n';

interface FormErrors {
  name?: string;
  phone?: string;
  password?: string;
  organizationName?: string;
}

export interface RegisterFormProps {
  role: UserRole;
  onSuccess?: () => void;
}

/**
 * Formulir pendaftaran.
 *
 * Formulir ini pernah meminta NIK — wajib untuk warga dan pemulung, opsional
 * untuk UMKM. Field itu dihapus seluruhnya. Mengumpulkan nomor kependudukan
 * yang tidak dapat dicocokkan ke sumber resmi mana pun (Permendagri 102/2019
 * membatasi akses Dukcapil) hanya memindahkan risiko kebocoran ke pengguna
 * tanpa memberi jaminan apa pun sebagai gantinya — dan bagi pemulung, satu
 * layar tambahan yang meminta KTP adalah alasan paling umum untuk berhenti
 * mendaftar. Kepercayaan dibangun setelah pendaftaran, lewat penjaminan mitra.
 */
export function RegisterForm({ role, onSuccess }: RegisterFormProps) {
  const register = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = t.auth.errors.nameMin;
    if (!isValidPhoneID(phone)) next.phone = t.auth.errors.phoneInvalid;
    if (password.length < 8) next.password = t.auth.errors.passwordMin;
    if (role !== 'HOUSEHOLD' && organizationName.trim().length < 3) {
      next.organizationName = 'Nama organisasi minimal 3 karakter';
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
        role: role as 'HOUSEHOLD' | 'MANAGER_ADMIN' | 'BUSINESS_BUYER',
        organizationName: role === 'HOUSEHOLD' ? undefined : organizationName.trim(),
      });
      onSuccess?.();
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.auth.registerFailed));
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
      {role !== 'HOUSEHOLD' ? (
        <Input
          label={role === 'MANAGER_ADMIN' ? 'Nama Pengelola' : 'Nama Business'}
          autoCapitalize="words"
          value={organizationName}
          onChangeText={setOrganizationName}
          error={errors.organizationName}
          testID="register-organization"
        />
      ) : null}
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
        style={formS.submit}
      />
    </View>
  );
}

const formS = StyleSheet.create({
  submit: { marginTop: spacing.md },
});
