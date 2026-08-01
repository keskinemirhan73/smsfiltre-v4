export type InitialRoute = 'Onboarding' | 'MainTabs';

export function getInitialRoute(hasCompletedOnboarding: boolean): InitialRoute {
  return hasCompletedOnboarding ? 'MainTabs' : 'Onboarding';
}
