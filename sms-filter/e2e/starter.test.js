# E2E Testing with Detox (Placeholder)

This file serves as a placeholder for the E2E testing pipeline for the SMS filter.
Since testing SMS natively in a simulator requires mocking the `IdentityLookup` (iOS) or `Telephony` (Android) frameworks, the actual E2E test will trigger the `RulesScreen` UI additions and verify that the Native modules return a "Sync Success" callback.

```javascript
describe('SMS Filter E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should add a new keyword and sync to App Group', async () => {
    await element(by.id('RulesTab')).tap();
    await element(by.id('KeywordInput')).typeText('bahis');
    await element(by.id('AddRuleButton')).tap();
    
    // Verify UI
    await expect(element(by.text('bahis'))).toBeVisible();
    
    // In a real test, we would mock the Native bridge and verify the array contains 'bahis'
  });
});
```
