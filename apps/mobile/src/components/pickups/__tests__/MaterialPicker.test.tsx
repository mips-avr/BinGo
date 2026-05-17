import { fireEvent, render } from '@testing-library/react-native';
import { MaterialType } from '@bingo/shared-types';
import { MaterialPicker } from '../MaterialPicker';

describe('<MaterialPicker />', () => {
  it('menampilkan seluruh opsi material dengan label Bahasa Indonesia', () => {
    const { getByText } = render(<MaterialPicker value={null} onChange={() => undefined} />);
    expect(getByText(/PET \(Botol minuman\)/)).toBeTruthy();
    expect(getByText(/HDPE/)).toBeTruthy();
    expect(getByText(/Sampah organik/)).toBeTruthy();
  });

  it('memanggil onChange dengan enum MaterialType saat ditekan', () => {
    const onChange = jest.fn();
    const { getByText } = render(<MaterialPicker value={null} onChange={onChange} />);
    fireEvent.press(getByText(/PET \(Botol minuman\)/));
    expect(onChange).toHaveBeenCalledWith(MaterialType.PET);
  });

  it('menampilkan pesan error bila diberikan', () => {
    const { getByText } = render(
      <MaterialPicker value={null} onChange={() => undefined} error="Pilih dulu" />,
    );
    expect(getByText('Pilih dulu')).toBeTruthy();
  });
});
