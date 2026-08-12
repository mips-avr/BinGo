import { useRoleDashboard } from '../../src/features/pivot/hooks';
import { RoleDashboardView } from '../../src/components/pivot/RoleDashboardView';
export default function HouseholdHome() { return <RoleDashboardView query={useRoleDashboard()} />; }
