import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const DragOverlay = ({ draggedVariant, dragPosition, isDragging }) => {
  const headerHeight = 64;
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: dragPosition.x - 40, // Center the variant on the drag point (assuming 80px width / 2)
    top: dragPosition.y - 20 - headerHeight,  // Center the variant + account for header height (64px)
    zIndex: 9999,
    opacity: isDragging ? 1 : 0,
  }), [dragPosition, isDragging]);

  if (!isDragging || !draggedVariant) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <View style={styles.variant}>
        <Text style={styles.variantText}>{draggedVariant}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    pointerEvents: 'none', // Don't interfere with touch events
  },
  variant: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#a089d1', // Purple - same as selected variant
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    transform: [{ scale: 1.1 }], // Slightly larger when dragging
  },
  variantText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#452563', // Dark purple text
    fontWeight: 'bold',
    fontFamily: 'Comic Sans MS',
  },
});

export default DragOverlay;
