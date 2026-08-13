import { useRoleDashboard } from '../../src/features/pivot/hooks';
import { RoleDashboardView } from '../../src/components/pivot/RoleDashboardView';
export default function ManagerHome() {
  return <RoleDashboardView query={useRoleDashboard()} />;
}
