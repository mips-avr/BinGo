import { Redirect } from 'expo-router';

/** Route kompatibilitas untuk tautan dashboard lama. */
export default function LegacyOperationsRedirect() {
  return <Redirect href={'/(manager)/runs' as never} />;
}
