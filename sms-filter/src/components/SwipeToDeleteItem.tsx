import React, { useRef } from 'react';
import { Animated, View, StyleSheet, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAppTheme, radii, spacing } from '../theme';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80; // Distance needed to trigger delete

interface SwipeToDeleteItemProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeToDeleteItem({ children, onDelete }: SwipeToDeleteItemProps) {
  const theme = useAppTheme();
  const pan = useRef(new Animated.ValueXY()).current;
  const isDeleted = useRef(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const itemHeight = useRef(new Animated.Value(1)).current; // For collapse animation

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if swiping horizontally significantly
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping left
        if (gestureState.dx < 0 && !isDeleted.current) {
          pan.setValue({ x: gestureState.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD && !isDeleted.current) {
          // Trigger delete
          isDeleted.current = true;
          Animated.timing(pan, {
            toValue: { x: -width, y: 0 },
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            // Collapse the item height after it swipes off screen
            Animated.parallel([
              Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
            ]).start(() => {
              onDelete();
            });
          });
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={{ opacity, marginBottom: spacing.sm }}>
      <View style={[styles.backgroundContainer, { backgroundColor: theme.danger }]}>
        <Trash2 color="#FFF" size={24} style={styles.trashIcon} />
      </View>
      <Animated.View
        style={{
          transform: [{ translateX: pan.x }],
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: spacing.lg,
  },
  trashIcon: {
    opacity: 0.9,
  },
});
