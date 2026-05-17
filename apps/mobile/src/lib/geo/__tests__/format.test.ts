import { formatDistanceMeters } from '../format';

describe('formatDistanceMeters', () => {
  it('memformat meter untuk jarak di bawah 1 km', () => {
    expect(formatDistanceMeters(450)).toBe('450 m');
  });

  it('memformat kilometer untuk jarak jauh', () => {
    expect(formatDistanceMeters(5500)).toBe('5.5 km');
  });
});
