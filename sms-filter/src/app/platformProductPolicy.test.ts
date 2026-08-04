import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPermissionPlan,
  getProductExperience,
  resolvePlatformStartupRoute,
} from './platformProductPolicy';

test('Android ve iOS farkli urun deneyimleri kullanir', () => {
  assert.equal(getProductExperience('android'), 'android-default-sms');
  assert.equal(getProductExperience('ios'), 'ios-message-filter');
  assert.equal(getProductExperience('web'), 'protection-dashboard');
});

test('Android rol hazir olmadan mesajlasma ekranina gecmez', () => {
  assert.equal(resolvePlatformStartupRoute({
    platform: 'android',
    onboardingComplete: false,
    defaultSmsRoleHeld: false,
    androidMessagingReady: false,
  }), 'AndroidSmsOnboarding');

  assert.equal(resolvePlatformStartupRoute({
    platform: 'android',
    onboardingComplete: true,
    defaultSmsRoleHeld: false,
    androidMessagingReady: false,
  }), 'AndroidMessagingPreview');

  assert.equal(resolvePlatformStartupRoute({
    platform: 'android',
    onboardingComplete: true,
    defaultSmsRoleHeld: false,
    androidMessagingReady: true,
  }), 'AndroidSmsRoleSetup');

  assert.equal(resolvePlatformStartupRoute({
    platform: 'android',
    onboardingComplete: true,
    defaultSmsRoleHeld: true,
    androidMessagingReady: true,
  }), 'AndroidMessagingTabs');
});

test('iOS mevcut Message Filter akisini korur', () => {
  assert.equal(resolvePlatformStartupRoute({
    platform: 'ios',
    onboardingComplete: false,
    defaultSmsRoleHeld: false,
    androidMessagingReady: false,
  }), 'Onboarding');

  assert.equal(resolvePlatformStartupRoute({
    platform: 'ios',
    onboardingComplete: true,
    defaultSmsRoleHeld: false,
    androidMessagingReady: false,
  }), 'MainTabs');
});

test('Android izin plani rol onayindan once hassas SMS izni istemez', () => {
  assert.deepEqual(getPermissionPlan({
    platform: 'android',
    defaultSmsRoleHeld: false,
    androidMessagingReady: true,
  }), ['explain-default-sms-role', 'request-default-sms-role']);

  assert.deepEqual(getPermissionPlan({
    platform: 'android',
    defaultSmsRoleHeld: true,
    androidMessagingReady: true,
  }), ['verify-default-sms-role', 'request-role-scoped-sms-permissions', 'request-notifications']);
});

test('hazir olmayan Android urunu rol veya SMS izni istemez', () => {
  assert.deepEqual(getPermissionPlan({
    platform: 'android',
    defaultSmsRoleHeld: false,
    androidMessagingReady: false,
  }), ['show-messaging-preview']);
});

test('iOS Android rol API veya SMS izin plani kullanmaz', () => {
  assert.deepEqual(getPermissionPlan({
    platform: 'ios',
    defaultSmsRoleHeld: false,
    androidMessagingReady: true,
  }), ['explain-ios-message-filter']);
});
