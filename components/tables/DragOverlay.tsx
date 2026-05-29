import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DragPosition } from '../../types/ui';

interface DragOverlayProps {
  draggedVariant: string | null;
  dragPosition: DragPosition;
  isDragging: boolean;
  customVariantStyles?: ViewStyle;
  customTextStyles?: TextStyle;
}

const DragOverlay = ({
  draggedVariant,
  dragPosition,
  isDragging,
  customVariantStyles = {},
  customTextStyles = {},
}: DragOverlayProps) => {
  const headerHeight = 64;
  const insets = useSafeAreaInsets();
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: dragPosition.x,
    top: dragPosition.y - headerHeight,
    zIndex: 9999,
    opacity: isDragging ? 1 : 0,
  }), [dragPosition, isDragging]);

  if (!isDragging || !draggedVariant) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <View style={[styles.variant, customVariantStyles]}>
        <Text style={[styles.variantText, customTextStyles]}>{draggedVariant}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  variant: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#a089d1',
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
    transform: [{ scale: 1.1 }],
  },
  variantText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#452563',
    fontWeight: 'bold',
    fontFamily: 'ComicSansMS',
  },
});

export default DragOverlay;
