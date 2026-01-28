import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const START_SCROLL_STEP = 30;

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
  previousAnimationIsHappening,
}) => {
  
  const insets = useSafeAreaInsets();
  const scrollStepRef = React.useRef(START_SCROLL_STEP);
  const currentDirection = React.useRef(null);

  if (dragPosition && mainTableBodyLayout && !previousAnimationIsHappening.value) {
    const { x, y } = dragPosition;
    const edgeThreshold = 60;

    const left = mainTableBodyLayout.x;
    const top = mainTableBodyLayout.y + insets.top;
    const right = left + mainTableBodyLayout.width;
    const bottom = top + mainTableBodyLayout.height;

    const nearLeft = x >= left && x <= left + edgeThreshold && y >= top && y <= bottom && canScrollLeft;
    const nearRight = x >= right - edgeThreshold && x <= right && y >= top && y <= bottom && canScrollRight;
    const nearTop = y >= top && y <= top + edgeThreshold && canScrollUp;
    const nearBottom = y >= bottom - edgeThreshold && y <= bottom && canScrollDown;

    const direction =
      nearLeft ? 'left' :
      nearRight ? 'right' :
      nearTop ? 'up' :
      nearBottom ? 'down' :
      null;
    if (direction === 'left') onScrollLeft(scrollStepRef.current);
    if (direction === 'right') onScrollRight(scrollStepRef.current);
    if (direction === 'up') onScrollUp(scrollStepRef.current);
    if (direction === 'down') onScrollDown(scrollStepRef.current);
    if (currentDirection.current !== direction) {
      scrollStepRef.current = START_SCROLL_STEP; // Reset scroll step on direction change
    } else if (direction) {
      // Increase scroll step for faster scrolling
      scrollStepRef.current = Math.min(scrollStepRef.current + START_SCROLL_STEP, 300);
    }
    currentDirection.current = direction;
  }
          
  // }, [canScrollLeft, canScrollRight, canScrollUp, canScrollDown, onScrollLeft, onScrollRight, onScrollUp, onScrollDown, dragPosition, mainTableBodyLayout]);


  if (!showHandles) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollHandle
        direction="left"
        visible={canScrollLeft}
        onPress={() => onScrollLeft()}
      />
      <ScrollHandle
        direction="right"
        visible={canScrollRight}
        onPress={() => onScrollRight()}
      />
      <ScrollHandle
        direction="up"
        visible={canScrollUp}
        onPress={() => onScrollUp()}
      />
      <ScrollHandle
        direction="down"
        visible={canScrollDown}
        onPress={() => onScrollDown()}
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
