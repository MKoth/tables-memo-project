import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ScrollWorkspaceHandle } from '../../types/ui';

interface VerticalArrowedScrollViewProps extends Omit<
  ScrollViewProps,
  'ref' | 'onScroll' | 'scrollEventThrottle' | 'onContentSizeChange' | 'onLayout' | 'style' | 'contentContainerStyle'
> {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollViewStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  scrollEventThrottle?: number;
  arrowsContainerStyle?: StyleProp<ViewStyle>;
  arrowStyle?: StyleProp<ViewStyle>;
  upArrowStyle?: StyleProp<ViewStyle>;
  downArrowStyle?: StyleProp<ViewStyle>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const VerticalArrowedScrollView = forwardRef<ScrollWorkspaceHandle, VerticalArrowedScrollViewProps>(
  (
    {
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
    },
    ref
  ) => {
    const scrollRef = useRef<ScrollView>(null);
    const [scrollState, setScrollState] = useState({
      canScrollUp: false,
      canScrollDown: false,
    });
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [scrollOffset, setScrollOffset] = useState(0);

    useImperativeHandle(ref, () => ({
      scrollTo: (options: { y: number; animated?: boolean }) => {
        scrollRef.current?.scrollTo({ y: options.y, animated: options.animated ?? true });
      },
      scrollToTop: () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      },
      scrollToBottom: () => {
        scrollRef.current?.scrollToEnd({ animated: true });
      },
    }), []);

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

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      setScrollOffset(contentOffset.y);

      // Call parent onScroll if provided
      if (onScroll) {
        onScroll(event);
      }
    };

    const handleContentSizeChange = (width: number, height: number) => {
      setContentSize({ width, height });
    };

    const handleLayout = (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout;
      setContainerSize({ width, height });
    };

    const scrollToTop = () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const scrollToBottom = () => {
      scrollRef.current?.scrollToEnd({ animated: true });
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
  }
);

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
