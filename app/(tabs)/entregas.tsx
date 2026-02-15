// Reuse the dashboard screen logic but focused on Entregas or just as the main view
// User said "la principal es mis entregas", implying the dashboard IS now the Entregas tab or serves that purpose.
// However, the dashboard had a menu. We replaced the menu with tabs.
// So this screen should probably show the stats + the list of deliveries (which was previously navigation).
// But `EntregasScreen` component already exists. Let's redirect to that or use it directly.
// Given the user wants "Mis Entregas" as the tab, maybe they want the LIST of deliveries there.
// But they also want "Dashboard" features probably.
// Let's use `EntregasScreen` directly as the tab content since tabs cover navigation.

import EntregasScreen from '@/components/screens/EntregasScreen';
export default EntregasScreen;
