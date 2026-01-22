import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ScrollHandle = ({ direction, onPress, visible }) => {
  const getIconName = () => {
    switch (direction) {
      case 'left': return 'chevron-back';
      case 'right': return 'chevron-forward';
      case 'up': return 'chevron-up';
      case 'down': return 'chevron-down';
      default: return 'chevron-forward';
    }
  };

  const getPositionStyle = () => {
    switch (direction) {
      case 'left':
        return { left: -10, top: '50%', transform: [{ translateY: -20 }] };
      case 'right':
        return { right: -10, top: '50%', transform: [{ translateY: -20 }] };
      case 'up':
        return { top: -10, left: '50%', transform: [{ translateX: -20 }] };
      case 'down':
        return { bottom: -10, left: '50%', transform: [{ translateX: -20 }] };
      default:
        return {};
    }
  };

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={[styles.handle, getPositionStyle()]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={getIconName()} size={24} color="#666" />
    </TouchableOpacity>
  );
};

const ScrollHandles = ({
  canScrollLeft,
  canScrollRight,
  canScrollUp,
  canScrollDown,
  onScrollLeft,
  onScrollRight,
  onScrollUp,
  onScrollDown,
  showHandles,
  dragPosition,
  mainTableBodyLayout,
}) => {
  // Auto-scroll when hovering over handles
  React.useEffect(() => {
    if (!dragPosition || !mainTableBodyLayout) return;

    const { x, y } = dragPosition;
    
    // Define edge zones
    const edgeThreshold = 30; // Larger threshold for easier triggering

    const tableBodyLeft = mainTableBodyLayout.x;
    const tableBodyTop = mainTableBodyLayout.y;
    const tableBodyRight = tableBodyLeft + mainTableBodyLayout.width;
    const tableBodyBottom = tableBodyTop + mainTableBodyLayout.height;


    const nearLeft = x >= tableBodyLeft && x <= tableBodyLeft + edgeThreshold &&
                     y >= tableBodyTop && y <= tableBodyBottom &&
                     canScrollLeft;
    const nearRight = x >= (tableBodyRight - edgeThreshold) && x <= tableBodyRight &&
                      y >= tableBodyTop && y <= tableBodyBottom &&
                      canScrollRight;
    const nearTop = y >= tableBodyTop && y <= tableBodyTop + edgeThreshold && canScrollUp;
    const nearBottom = y >= (tableBodyBottom - edgeThreshold) && y <= tableBodyBottom && canScrollDown;
    
    // Trigger scroll based on edge proximity
    if (nearLeft) {
      onScrollLeft();
    } else if (nearRight) {
      onScrollRight();
    } else if (nearTop) {
      onScrollUp();
    } else if (nearBottom) {
      onScrollDown();
    }

  }, [dragPosition, canScrollLeft, canScrollRight, canScrollUp, canScrollDown, onScrollLeft, onScrollRight, onScrollUp, onScrollDown]);

  if (!showHandles) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollHandle
        direction="left"
        visible={canScrollLeft}
        onPress={onScrollLeft}
      />
      <ScrollHandle
        direction="right"
        visible={canScrollRight}
        onPress={onScrollRight}
      />
      <ScrollHandle
        direction="up"
        visible={canScrollUp}
        onPress={onScrollUp}
      />
      <ScrollHandle
        direction="down"
        visible={canScrollDown}
        onPress={onScrollDown}
      />
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
    pointerEvents: 'box-none', // Allow touches to pass through to underlying elements
  },
  handle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 100,
  },
});

export default ScrollHandles;
