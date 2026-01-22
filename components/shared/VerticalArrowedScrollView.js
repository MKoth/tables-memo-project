import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VerticalArrowedScrollView = ({
  children,
  style,
  contentContainerStyle,
  scrollViewStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  arrowsContainerStyle,
  arrowStyle,
  upArrowStyle,
  downArrowStyle,
  onScroll,
  ...scrollViewProps
}) => {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  // Update scroll state when content size or container size changes
  useEffect(() => {
    const canScroll = contentSize.height > containerSize.height;
    const isAtTop = scrollOffset <= 0;
    const isAtBottom = scrollOffset >= contentSize.height - containerSize.height - 2;

    setScrollState({
      canScrollUp: canScroll && !isAtTop,
      canScrollDown: canScroll && !isAtBottom,
    });
  }, [contentSize, containerSize, scrollOffset]);

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    setScrollOffset(contentOffset.y);

    // Call parent onScroll if provided
    if (onScroll) {
      onScroll(event);
    }
  };

  const handleContentSizeChange = (width, height) => {
    setContentSize({ width, height });
  };

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const scrollToTop = () => {
    const scrollRefCurrent = scrollRef.current || scrollViewProps.ref?.current;
    scrollRefCurrent?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    const scrollRefCurrent = scrollRef.current || scrollViewProps.ref?.current;
    scrollRefCurrent?.scrollToEnd({ animated: true });
  };

  return (
    <View style={style}>
      <ScrollView
        ref={scrollRef}
        style={scrollViewStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={contentContainerStyle}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>

      {/* Scroll Arrows */}
      <View style={[styles.arrowsContainer, arrowsContainerStyle]} pointerEvents="box-none">
        {scrollState.canScrollUp && (
          <TouchableOpacity
            style={[styles.scrollArrow, arrowStyle, upArrowStyle]}
            onPress={scrollToTop}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-up" size={24} color="#666" />
          </TouchableOpacity>
        )}
        {scrollState.canScrollDown && (
          <TouchableOpacity
            style={[styles.scrollArrow, arrowStyle, downArrowStyle]}
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
  arrowsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  scrollArrow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
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

export default VerticalArrowedScrollView;
