module.exports = () => ({
  type: "unwanted-communication",
  name: "smsreport",
  displayName: "FiltreAI",
  bundleIdentifier: ".smsreport",
  deploymentTarget: "15.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.filtreai.app"],
  },
});
