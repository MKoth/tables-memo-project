import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';

const DraggableVariant = ({
  variant,
  isSelected,
  isUsed,
  onVariantSelect,
  onDragStart,
  onDragEnd,
  onDragUpdate,
  isBeingDragged,
}) => {
  const variantRef = useRef(null);
  const dragOffset = useSharedValue({ x: 0, y: 0 });
  const isDragging = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragOffset.value.x },
      { translateY: dragOffset.value.y },
      { scale: isDragging.value ? 1.1 : 1 },
    ],
    zIndex: isDragging.value ? 1000 : 1,
    opacity: isBeingDragged ? 0 : 1, // Hide when being dragged globally
    backgroundColor: isSelected ? '#a089d1' : '#e6e6fa', // Dark purple for selected, light purple for normal
  }), [isBeingDragged, isSelected]);



  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      scheduleOnRN(onDragStart, variant);
    })
    .onUpdate((event) => {
      'worklet';
      dragOffset.value = {
        x: event.translationX,
        y: event.translationY,
      };
      scheduleOnRN(onDragUpdate, event.absoluteX, event.absoluteY, variant);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      dragOffset.value = { x: 0, y: 0 };
      scheduleOnRN(onDragEnd, variant);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.variant, animatedStyle]}>
        <TouchableOpacity
          ref={variantRef}
          style={styles.variantTouchable}
          onPress={() => onVariantSelect(variant, variantRef)}
          disabled={isUsed}
        >
          <Text style={[
            styles.variantText,
            isSelected && styles.selectedVariantText,
            isUsed && styles.usedVariantText,
          ]}>
            {variant}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const VariantsList = ({
  variants,
  selectedVariant,
  onVariantSelect,
  usedVariants = [],
  onVariantDragStart,
  onVariantDragEnd,
  onVariantDragUpdate,
  draggedVariant,
}) => {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  const handleScroll = (event) => {
    console.log(event);
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtTop = contentOffset.y <= 0;
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 2; // added 2 pixels of offset to be sure
    const canScroll = contentSize.height > layoutMeasurement.height;

    setScrollState({
      canScrollUp: canScroll && !isAtTop,
      canScrollDown: canScroll && !isAtBottom,
    });
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drag a variant or tap to select:</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.variantsContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={handleScroll}
      >
        {variants.map((variant, index) => {
          const isSelected = selectedVariant === variant;
          const isUsed = usedVariants.includes(variant);
          const isBeingDragged = draggedVariant === variant;

          return (
            <DraggableVariant
              key={`${variant}-${index}`}
              variant={variant}
              isSelected={isSelected}
              isUsed={isUsed}
              onVariantSelect={onVariantSelect}
              onDragStart={onVariantDragStart}
              onDragEnd={onVariantDragEnd}
              onDragUpdate={onVariantDragUpdate}
              isBeingDragged={isBeingDragged}
            />
          );
        })}
      </ScrollView>

      {/* Scroll Arrows */}
      <View style={styles.arrowsContainer} pointerEvents="box-none">
        {scrollState.canScrollUp && (
          <TouchableOpacity
            style={[styles.scrollArrow, styles.upArrow]}
            onPress={scrollToTop}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-up" size={24} color="#666" />
          </TouchableOpacity>
        )}
        {scrollState.canScrollDown && (
          <TouchableOpacity
            style={[styles.scrollArrow, styles.downArrow]}
            onPress={scrollToBottom}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Comic Sans MS',
  },
  scrollContainer: {
    maxHeight: '20vh',
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  variant: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#e6e6fa', // Light purple
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedVariant: {
    backgroundColor: '#a089d1', // Purple
    transform: [{ scale: 1.05 }],
  },
  usedVariant: {
    opacity: 0.4,
    backgroundColor: '#f0f0f0',
  },
  variantTouchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Comic Sans MS',
  },
  selectedVariantText: {
    color: '#452563', // Dark purple
    fontWeight: 'bold',
    fontFamily: 'Comic Sans MS',
  },
  usedVariantText: {
    color: '#999',
    fontFamily: 'Comic Sans MS',
  },
  arrowsContainer: {
    position: 'absolute',
    top: 40, // Below the title
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  scrollArrow: {
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
  upArrow: {
    top: 0,
    right: 10,
  },
  downArrow: {
    bottom: 0,
    right: 10,
  },
});

export default VariantsList;
