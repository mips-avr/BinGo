jest.mock('expo-secure-store');
jest.mock('../../../features/auth/api');

import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginForm } from '../LoginForm';
import { loginApi } from '../../../features/auth/api';
import { useAuthStore } from '../../../store/authStore';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ status: 'idle', user: null, accessToken: null });
});

describe('<LoginForm />', () => {
  it('menampilkan pesan validasi Bahasa Indonesia untuk input invalid', async () => {
    const onSuccess = jest.fn();
    const { getByTestId, findByText } = render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.changeText(getByTestId('login-phone'), 'salah');
    fireEvent.changeText(getByTestId('login-password'), 'short');
    fireEvent.press(getByTestId('login-submit'));

    expect(await findByText(/Nomor telepon tidak valid/i)).toBeTruthy();
    expect(await findByText(/Kata sandi minimal 8 karakter/i)).toBeTruthy();
    expect(loginApi).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('memanggil login + onSuccess saat input valid', async () => {
    (loginApi as jest.Mock).mockResolvedValue({
      user: {
        id: 'u1',
        nik: null,
        name: 'Budi',
        phone: '+628123456789',
        role: 'CITIZEN',
        pointsBalance: 0,
        createdAt: new Date().toISOString(),
      },
      token: { accessToken: 'jwt', expiresIn: 3600 },
    });

    const onSuccess = jest.fn();
    const { getByTestId } = render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.changeText(getByTestId('login-phone'), '08123456789');
    fireEvent.changeText(getByTestId('login-password'), 'rahasia123');
    fireEvent.press(getByTestId('login-submit'));

    await waitFor(() => expect(loginApi).toHaveBeenCalledWith({
      phone: '08123456789',
      password: 'rahasia123',
    }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('menampilkan Alert berbahasa Indonesia saat API gagal', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (loginApi as jest.Mock).mockRejectedValue(new Error('Nomor telepon atau kata sandi salah'));

    const { getByTestId } = render(<LoginForm />);
    fireEvent.changeText(getByTestId('login-phone'), '08123456789');
    fireEvent.changeText(getByTestId('login-password'), 'rahasia123');
    fireEvent.press(getByTestId('login-submit'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    const message = alertSpy.mock.calls[0]?.[1] as string;
    expect(message).toMatch(/Nomor telepon atau kata sandi salah/i);
  });
});
