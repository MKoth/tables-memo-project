import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DragPosition } from '../../types/ui';

interface ColumnBounds {
  left: number;
  right: number;
}

interface MatchingScrollArrowsProps {
  isDragging: boolean;
  dragPosition: DragPosition | null;
  columnBounds: ColumnBounds | null;
}

const MatchingScrollArrows = ({
  isDragging,
  dragPosition,
  columnBounds,
}: MatchingScrollArrowsProps) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const SCROLL_THRESHOLD = 30;

  useEffect(() => {
    if (!isDragging || !dragPosition || !columnBounds) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    const { x } = dragPosition;
    const { left, right } = columnBounds;

    setShowLeftArrow(x < left + SCROLL_THRESHOLD);
    setShowRightArrow(x > right - SCROLL_THRESHOLD);
  }, [isDragging, dragPosition, columnBounds]);

  if (!isDragging) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {showLeftArrow && (
        <View style={[styles.arrow, styles.leftArrow]}>
          <Text style={styles.arrowText}>←</Text>
        </View>
      )}
      {showRightArrow && (
        <View style={[styles.arrow, styles.rightArrow]}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  leftArrow: {
    left: 10,
    marginTop: -20,
  },
  rightArrow: {
    right: 10,
    marginTop: -20,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default MatchingScrollArrows;
