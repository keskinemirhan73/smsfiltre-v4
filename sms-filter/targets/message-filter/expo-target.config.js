module.exports = config => {
  config.type = "action"; // Using 'action' as a base extension type since 'message-filter' isn't a default template
  config.entitlements = {
    'com.apple.security.application-groups': ['group.com.smsfilter.app']
  };
  return config;
};
