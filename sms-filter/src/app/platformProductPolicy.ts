export type SupportedPlatform = 'android' | 'ios' | 'web' | string;

export type ProductExperience =
  | 'android-default-sms'
  | 'ios-message-filter'
  | 'protection-dashboard';

export type PlatformStartupRoute =
  | 'AndroidSmsOnboarding'
  | 'AndroidMessagingPreview'
  | 'AndroidSmsRoleSetup'
  | 'AndroidMessagingTabs'
  | 'Onboarding'
  | 'MainTabs';

export type PermissionPlanStep =
  | 'show-messaging-preview'
  | 'explain-default-sms-role'
  | 'request-default-sms-role'
  | 'verify-default-sms-role'
  | 'request-role-scoped-sms-permissions'
  | 'request-notifications'
  | 'explain-ios-message-filter';

interface PlatformState {
  platform: SupportedPlatform;
  defaultSmsRoleHeld: boolean;
  androidMessagingReady: boolean;
}

interface StartupState extends PlatformState {
  onboardingComplete: boolean;
}

export function getProductExperience(platform: SupportedPlatform): ProductExperience {
  if (platform === 'android') return 'android-default-sms';
  if (platform === 'ios') return 'ios-message-filter';
  return 'protection-dashboard';
}

export function resolvePlatformStartupRoute(state: StartupState): PlatformStartupRoute {
  if (state.platform !== 'android') {
    return state.onboardingComplete ? 'MainTabs' : 'Onboarding';
  }

  if (!state.onboardingComplete) return 'AndroidSmsOnboarding';
  if (!state.androidMessagingReady) return 'AndroidMessagingPreview';
  if (!state.defaultSmsRoleHeld) return 'AndroidSmsRoleSetup';
  return 'AndroidMessagingTabs';
}

export function getPermissionPlan(state: PlatformState): PermissionPlanStep[] {
  if (state.platform === 'ios') return ['explain-ios-message-filter'];
  if (state.platform !== 'android') return [];
  if (!state.androidMessagingReady) return ['show-messaging-preview'];

  if (!state.defaultSmsRoleHeld) {
    return ['explain-default-sms-role', 'request-default-sms-role'];
  }

  return [
    'verify-default-sms-role',
    'request-role-scoped-sms-permissions',
    'request-notifications',
  ];
}
