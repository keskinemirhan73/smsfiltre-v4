module.exports = () => ({
  type: "action",
  name: "smsaction",
  displayName: "FiltreAI",
  bundleIdentifier: ".smsaction",
  deploymentTarget: "15.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.filtreai.app"],
  },
});
