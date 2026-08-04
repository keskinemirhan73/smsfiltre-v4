import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface BrandSplashScreenProps {
  onReady: () => void;
}

export default function BrandSplashScreen({ onReady }: BrandSplashScreenProps) {
  return (
    <View style={styles.container} onLayout={onReady}>
      <Image
        accessibilityLabel="FiltreAI"
        source={require('../../assets/premium_splash.png')}
        resizeMode="contain"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
