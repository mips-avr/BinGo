import { fireEvent, render } from '@testing-library/react-native';
import { NearbyPickupCard } from '../NearbyPickupCard';
import type { NearbyPickupResult } from '../../../features/pickups/api';

const pickup: NearbyPickupResult = {
  id: 'p1',
  citizenId: 'c1',
  agentId: null,
  status: 'PENDING',
  location: { lat: -6.2, lng: 106.8 },
  address: 'Bundaran HI',
  materialType: 'PET',
  estimatedWeightKg: 2.5,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  distanceMeters: 1500,
};

describe('<NearbyPickupCard />', () => {
  it('menampilkan jarak dan material', () => {
    const { getByText } = render(<NearbyPickupCard pickup={pickup} />);
    expect(getByText(/1\.5 km/)).toBeTruthy();
    expect(getByText(/PET/)).toBeTruthy();
    expect(getByText('Bundaran HI')).toBeTruthy();
  });

  it('memanggil onAccept saat tombol ditekan', () => {
    const onAccept = jest.fn();
    const { getByTestId } = render(
      <NearbyPickupCard pickup={pickup} onAccept={onAccept} />,
    );
    fireEvent.press(getByTestId('accept-pickup-p1'));
    expect(onAccept).toHaveBeenCalled();
  });
});
