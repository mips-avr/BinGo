import { Redirect } from 'expo-router';
import { AppSplash } from '../src/components/ui/AppSplash';
import { getAuthenticatedHome } from '../src/lib/navigation/role-routes';
import { useAuthStore } from '../src/store/authStore';

/**
 * Router root — splash singkat lalu redirect ke login atau home.
 */
export default function IndexRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'idle' || status === 'loading') {
    return <AppSplash />;
  }

  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getAuthenticatedHome(user.role)} />;
}
