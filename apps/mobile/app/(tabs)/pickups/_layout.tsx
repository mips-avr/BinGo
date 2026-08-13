import { Redirect } from 'expo-router';

export default function LegacyPickupRedirect() {
  return <Redirect href={'/(tabs)/services' as never} />;
}
