const baseConfig = require('./app.json').expo;

const APPLE_TEAM_ID_PATTERN = /^[A-Z0-9]{10}$/;

module.exports = ({ config = {} } = {}) => {
  const appleTeamId = process.env.EXPO_APPLE_TEAM_ID?.trim().toUpperCase();
  if (appleTeamId && !APPLE_TEAM_ID_PATTERN.test(appleTeamId)) {
    throw new Error('EXPO_APPLE_TEAM_ID tam olarak 10 karakter olmalıdır.');
  }

  return {
    ...baseConfig,
    ...config,
    ios: {
      ...baseConfig.ios,
      ...config.ios,
      ...(appleTeamId ? { appleTeamId } : {}),
    },
  };
};
