import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedRef, useAnimatedScrollHandler, scrollTo } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScrollHandles from '../tables/ScrollHandles';



const MatchingWordItem = React.memo(({
  item,
  isSelected,
  isHovered,
  isFadingOut,
  isWrongMatch,
  onWordPress,
  handleWordLayout,
  registerItemRef,
  onDragStart,
  onDragEnd,
  onDragUpdate,
}) => {
  const dragOffset = useSharedValue({ x: 0, y: 0 });
  const isDragging = useSharedValue(false);
  const opacity = useSharedValue(1);
  const itemRef = useRef(null);

  useEffect(() => {
    if (isFadingOut) {
      opacity.value = withTiming(0, { duration: 300 });
    } else {
      opacity.value = 1;
    }
  }, [isFadingOut]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: dragOffset.value.x },
      { translateY: dragOffset.value.y },
    ],
  }));

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      scheduleOnRN(onDragStart, item.id, item.text);
    })
    .onUpdate((event) => {
      'worklet';
      dragOffset.value = {
        x: event.translationX,
        y: event.translationY,
      };
      scheduleOnRN(
        onDragUpdate,
        item.id,
        event.absoluteX,
        event.absoluteY,
        event.translationX,
        event.translationY
      );
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      dragOffset.value = { x: 0, y: 0 };
      scheduleOnRN(onDragEnd, item.id);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        ref={(r) => {
          itemRef.current = r;
          if (registerItemRef) {
            // store or remove ref in parent map
            registerItemRef(item.id, r);
          }
        }}
        style={[styles.wordContainer, animatedStyle]}
        onLayout={(e) => {
          // Try to measure absolute position in window for hit testing
          try {
            if (itemRef && itemRef.current && itemRef.current.measureInWindow) {
              itemRef.current.measureInWindow((x, y, width, height) => {
                handleWordLayout(item.id, { x, y, width, height });
              });
            } else {
              handleWordLayout(item.id, e.nativeEvent.layout);
            }
          } catch (err) {
            handleWordLayout(item.id, e.nativeEvent.layout);
          }
        }}
        pointerEvents={isFadingOut ? 'none' : 'auto'}
      >
        <View
          style={[
            styles.wordButton,
            isSelected && styles.selectedWord,
            isHovered && styles.hoveredWord,
            isFadingOut && styles.successWord,
            isWrongMatch && styles.errorWord,
          ]}
          onTouchEnd={() => !isFadingOut && onWordPress(item.id)}
        >
          <Text
            style={[
              styles.wordText,
              isSelected && styles.selectedWordText,
              (isFadingOut || isWrongMatch) && styles.matchWordText,
            ]}
            numberOfLines={1}
          >
            {item.text}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const MatchingColumn = ({
  words,
  isLeftColumn,
  selectedId,
  hoveredId,
  fadingOutIds,
  wrongMatchIds,
  onWordPress,
  onLayoutChange,
  onDragStart,
  onDragEnd,
  onDragUpdate,
  measureSignal,
  dragPosition,
}) => {
  const insets = useSafeAreaInsets();
  const [mainColumnBodyLayout, setMainColumnBodyLayout] = useState(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  // Map to store word layouts by id
  const wordLayouts = useRef(new Map()).current;
  const itemRefs = useRef(new Map()).current;
  const listRef = useAnimatedRef();
  const scrollY = useSharedValue(0);
  const maxVerticalOffset = useSharedValue(0);

  const updateScrollability = (y, maxV) => {
    setCanScrollUp(y > 0);
    setCanScrollDown(y < maxV);
  };

  // Remove layouts for words that are no longer present
  useEffect(() => {
    const wordIds = new Set(words.map(w => w.id));
    // Remove any layout for words not in the current list
    for (const id of Array.from(wordLayouts.keys())) {
      if (!wordIds.has(id)) {
        wordLayouts.delete(id);
        // Optionally, notify parent that this word is gone
        onLayoutChange(id, null);
      }
    }
    // Also remove any refs for words that disappeared
    for (const id of Array.from(itemRefs.keys())) {
      if (!wordIds.has(id)) {
        itemRefs.delete(id);
      }
    }
  }, [words, wordLayouts, onLayoutChange]);

  const handleWordLayout = useCallback(
    (wordId, layout) => {
      wordLayouts.set(wordId, layout);
      onLayoutChange(wordId, layout);
    },
    [wordLayouts, onLayoutChange]
  );

  const registerItemRef = useCallback((wordId, node) => {
    if (node) {
      itemRefs.set(wordId, node);
    } else {
      itemRefs.delete(wordId);
    }
  }, [itemRefs]);

  const handleScroll = useCallback(() => {
    // Re-measure visible items using their refs and update layouts
    for (const [wordId, ref] of itemRefs.entries()) {
      try {
        if (ref && ref.measureInWindow) {
          ref.measureInWindow((x, y, width, height) => {
            handleWordLayout(wordId, { x, y, width, height });
          });
        }
      } catch (err) {
        // ignore measurement errors
      }
    }
  }, [itemRefs, handleWordLayout]);

  // Animated scroll handler (UI thread) — update shared scrollY and notify JS about scrollability
  const onAnimatedScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: (event) => {
      scrollY.value = event.contentOffset.y;
      // propagate to JS to update canScrollUp/down
      scheduleOnRN(updateScrollability, event.contentOffset.y, maxVerticalOffset.value);
    }
  });

  // UI worklets to scroll up/down — called from ScrollHandles' useFrameCallback (UI thread)
  const uiScrollUp = (scrollStep, animated) => {
    'worklet';
    const newOffset = Math.max(0, scrollY.value - scrollStep);
    scrollY.value = newOffset;
    if (listRef) scrollTo(listRef, 0, newOffset, animated);
  };

  const uiScrollDown = (scrollStep, animated) => {
    'worklet';
    const newOffset = Math.min(maxVerticalOffset.value, scrollY.value + scrollStep);
    scrollY.value = newOffset;
    if (listRef) scrollTo(listRef, 0, newOffset, animated);
  };

  // JS wrappers to call UI worklets
  const scrollUp = (step = 50, animated = true) => {
    scheduleOnUI(uiScrollUp, step, animated);
  };

  const scrollDown = (step = 50, animated = true) => {
    scheduleOnUI(uiScrollDown, step, animated);
  };

  useEffect(() => {
    handleScroll();
  }, [measureSignal, handleScroll]);

  const renderWord = useCallback(
    ({ item }) => {
      const isSelected = selectedId === item.id;
      const isHovered = hoveredId === item.id;
      const isFadingOut = fadingOutIds.includes(item.id);
      const isWrongMatch = wrongMatchIds.includes(item.id);

      return (
        <MatchingWordItem
          item={item}
          isSelected={isSelected}
          isHovered={isHovered}
          isFadingOut={isFadingOut}
          isWrongMatch={isWrongMatch}
          onWordPress={onWordPress}
          handleWordLayout={handleWordLayout}
          registerItemRef={registerItemRef}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragUpdate={onDragUpdate}
        />
      );
    },
    [
      selectedId,
      hoveredId,
      fadingOutIds,
      wrongMatchIds,
      onWordPress,
      handleWordLayout,
      onDragStart,
      onDragEnd,
      onDragUpdate,
    ]
  );

  return (
    <View
      style={styles.columnContainer}
      onLayout={(event) => {
        const layout = event.nativeEvent.layout;
        const { width, height } = layout;
        // measure in window to get screen coords for ScrollHandles comparisons
        try {
          event.target.measureInWindow((x, y, w, h) => {
            setMainColumnBodyLayout({ x, y: y - insets.top, width: w, height: h - 30 /** adjust for padding 15px on both top and bottom */ });
          });
        } catch (err) {
          setMainColumnBodyLayout({ x: 0, y: 0, width, height });
        }

        // estimate content height and update maxVerticalOffset
        const ITEM_MARGIN = 16; // approximate
        const ITEM_MIN_HEIGHT = 50;
        const totalContentHeight = Math.max(0, words.length * (ITEM_MIN_HEIGHT + ITEM_MARGIN));
        const maxV = Math.max(0, totalContentHeight - height + 15 /** adjust for padding 15px on both top and bottom */);
        maxVerticalOffset.value = maxV;
        // update JS booleans
        setCanScrollUp(scrollY.value > 0);
        setCanScrollDown(scrollY.value < maxV);
      }}
    >
      <Animated.ScrollView
        ref={listRef}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.flatListContent}
        onScroll={onAnimatedScroll}
        scrollEventThrottle={16}
      >
        {words.map((item) => (
          <React.Fragment key={item.id}>{renderWord({ item })}</React.Fragment>
        ))}
      </Animated.ScrollView>

      <ScrollHandles
        canScrollLeft={false}
        canScrollRight={false}
        canScrollUp={canScrollUp}
        canScrollDown={canScrollDown}
        onScrollLeft={() => {}}
        onScrollRight={() => {}}
        onScrollUp={() => scrollUp()}
        onScrollDown={() => scrollDown()}
        uiScrollLeft={null}
        uiScrollRight={null}
        uiScrollUp={uiScrollUp}
        uiScrollDown={uiScrollDown}
        showHandles={true}
        dragPosition={dragPosition}
        mainTableBodyLayout={mainColumnBodyLayout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  columnContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  flatListContent: {
    paddingVertical: 10,
  },
  wordContainer: {
    marginVertical: 8,
  },
  wordButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    minHeight: 50,
  },
  selectedWord: {
    backgroundColor: '#d4f1d4',
    borderColor: '#4CAF50',
  },
  hoveredWord: {
    backgroundColor: '#e8f5e9',
    borderColor: '#81c784',
  },
  successWord: {
    backgroundColor: '#c8e6c9',
    borderColor: '#4CAF50',
  },
  errorWord: {
    backgroundColor: '#ffcdd2',
    borderColor: '#f44336',
  },
  wordText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'ComicSansMS',
    fontWeight: '500',
  },
  selectedWordText: {
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  matchWordText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default MatchingColumn;
