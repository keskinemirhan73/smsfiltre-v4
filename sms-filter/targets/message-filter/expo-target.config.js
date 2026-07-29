module.exports = () => ({
  type: "message-filter",
  name: "smsfilter",
  displayName: "FiltreAI",
  bundleIdentifier: ".messagefilter",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.filtreai.app"],
  },
});
