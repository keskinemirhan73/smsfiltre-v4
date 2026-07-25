module.exports = {
  dependencies: {
    'react-native-shared-group-preferences': {
      platforms: {
        android: null, // Sadece iOS için kullanıldığından Android derlemesini bozmasını engellemek için autolinking iptal edildi
      },
    },
  },
};
