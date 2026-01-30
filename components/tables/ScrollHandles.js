import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFrameCallback } from 'react-native-reanimated';

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

const START_MIN_SCROLL_STEP = 0.1;
const START_MAX_SCROLL_STEP = 5;

const calculateSpeed = (distance, threshold) => {
    'worklet';
    // proximity: 0 at threshold edge, 1 exactly at the boundary (closest to edge)
    const clamped = Math.max(0, Math.min(1, distance / threshold));
    const proximity = 1 - clamped;
    // ease-in using normalized exponential curve for a very smooth slow start and strong acceleration
    const k = 0.01; // steepness
    const eased = (1 - Math.exp(-k * proximity)) / (1 - Math.exp(-k));
    return START_MIN_SCROLL_STEP + (START_MAX_SCROLL_STEP - START_MIN_SCROLL_STEP) * eased;
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
  uiScrollLeft,
  uiScrollRight,
  uiScrollUp,
  uiScrollDown,
  showHandles,
  dragPosition,
  mainTableBodyLayout,
}) => {
  
  const insets = useSafeAreaInsets();
  const frameCallbackRef = useRef(null);

  const calculateDirection = () => {
    if (!dragPosition || !mainTableBodyLayout) return null;
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

    return nearLeft ? 'left' :
           nearRight ? 'right' :
           nearTop ? 'up' :
           nearBottom ? 'down' :
           null;
  };

  // Frame callback (runs on UI thread) — compute direction & speed and call UI worklets directly
  const frameCb = useFrameCallback((/* frameInfo */) => {
    'worklet';
    if (!dragPosition || !mainTableBodyLayout) return;

    const x = dragPosition.x;
    const y = dragPosition.y;
    const edgeThreshold = 60;

    const left = mainTableBodyLayout.x;
    const top = mainTableBodyLayout.y + insets.top;
    const right = left + mainTableBodyLayout.width;
    const bottom = top + mainTableBodyLayout.height;

    const nearLeft = x >= left && x <= left + edgeThreshold && y >= top && y <= bottom && canScrollLeft;
    const nearRight = x >= right - edgeThreshold && x <= right && y >= top && y <= bottom && canScrollRight;
    const nearTop = y >= top && y <= top + edgeThreshold && canScrollUp;
    const nearBottom = y >= bottom - edgeThreshold && y <= bottom && canScrollDown;

    if (nearLeft) {
      const distance = x - left;
      const speed = calculateSpeed(distance, edgeThreshold);
      if (uiScrollLeft) uiScrollLeft(speed, false);
      return;
    }

    if (nearRight) {
      const distance = right - x;
      const speed = calculateSpeed(distance, edgeThreshold);
      if (uiScrollRight) uiScrollRight(speed, false);
      return;
    }

    if (nearTop) {
      const distance = y - top;
      const speed = calculateSpeed(distance, edgeThreshold);
      if (uiScrollUp) uiScrollUp(speed, false);
      return;
    }

    if (nearBottom) {
      const distance = bottom - y;
      const speed = calculateSpeed(distance, edgeThreshold);
      if (uiScrollDown) uiScrollDown(speed, false);
      return;
    }
  }, false);

  // keep reference to frame callback controller so we can start/stop it
  frameCallbackRef.current = frameCb;

  useEffect(() => {
    const direction = calculateDirection();
    const active = !!direction;
    if (frameCallbackRef.current && typeof frameCallbackRef.current.setActive === 'function') {
      frameCallbackRef.current.setActive(active);
    }

    return () => {
      if (frameCallbackRef.current && typeof frameCallbackRef.current.setActive === 'function') {
        frameCallbackRef.current.setActive(false);
      }
    };
  }, [dragPosition, mainTableBodyLayout, canScrollLeft, canScrollRight, canScrollUp, canScrollDown, onScrollLeft, onScrollRight, onScrollUp, onScrollDown, insets]);

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
