import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { DragPosition } from '../../types/ui';

interface MatchingDragOverlayProps {
  draggedWord: string | null;
  dragPosition: DragPosition;
  isDragging: boolean;
}

const MatchingDragOverlay = ({
  draggedWord,
  dragPosition,
  isDragging,
}: MatchingDragOverlayProps) => {
  const headerHeight = 64;

  const animatedStyle = useAnimatedStyle(
    () => ({
      position: 'absolute',
      left: dragPosition.x - 40,
      top: dragPosition.y - 20 - headerHeight,
      zIndex: 9999,
      opacity: isDragging ? 1 : 0,
    }),
    [dragPosition, isDragging]
  );

  if (!isDragging || !draggedWord) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <View style={styles.word}>
        <Text style={styles.wordText}>{draggedWord}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  word: {
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
  wordText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#452563',
    fontWeight: 'bold',
    fontFamily: 'ComicSansMS',
  },
});

export default MatchingDragOverlay;
