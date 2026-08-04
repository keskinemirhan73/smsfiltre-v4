module.exports = () => ({
  type: "message-filter",
  name: "smsfilter",
  displayName: "FiltreAI",
  bundleIdentifier: ".messagefilter",
  deploymentTarget: "15.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.filtreai.app"],
  },
});
