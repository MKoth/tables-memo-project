import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  type ListRenderItem,
  type LayoutRectangle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { MatchingWord } from '../../utils/domain';
import type { LayoutRect } from '../../types/ui';

type MeasurableRef = {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
};

interface MatchingWordItemProps {
  item: MatchingWord;
  isSelected: boolean;
  isHovered: boolean;
  isFadingOut: boolean;
  isWrongMatch: boolean;
  onWordPress: (wordId: string) => void;
  handleWordLayout: (wordId: string, layout: LayoutRect) => void;
  registerItemRef?: (wordId: string, node: MeasurableRef | null) => void;
  onDragStart: (wordId: string, text: string) => void;
  onDragEnd: (wordId: string) => void;
  onDragUpdate: (
    wordId: string,
    absoluteX: number,
    absoluteY: number,
    translationX: number,
    translationY: number
  ) => void;
}

const MatchingWordItem = React.memo(
  ({
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
  }: MatchingWordItemProps) => {
    const dragOffset = useSharedValue({ x: 0, y: 0 });
    const isDragging = useSharedValue(false);
    const opacity = useSharedValue(1);
    const itemRef = useRef<MeasurableRef | null>(null);

    useEffect(() => {
      if (isFadingOut) {
        opacity.value = withTiming(0, { duration: 300 });
      } else {
        opacity.value = 1;
      }
    }, [isFadingOut, opacity]);

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

    const applyLayout = (layout: LayoutRectangle | LayoutRect) => {
      handleWordLayout(item.id, {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });
    };

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          ref={(r) => {
            const measurable = r as unknown as MeasurableRef | null;
            itemRef.current = measurable;
            if (registerItemRef) {
              registerItemRef(item.id, measurable);
            }
          }}
          style={[styles.wordContainer, animatedStyle]}
          onLayout={(e) => {
            try {
              if (itemRef.current?.measureInWindow) {
                itemRef.current.measureInWindow((x, y, width, height) => {
                  handleWordLayout(item.id, { x, y, width, height });
                });
              } else {
                applyLayout(e.nativeEvent.layout);
              }
            } catch {
              applyLayout(e.nativeEvent.layout);
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
  }
);

interface MatchingColumnProps {
  words: MatchingWord[];
  isLeftColumn: boolean;
  selectedId: string | null | undefined;
  hoveredId: string | null | undefined;
  fadingOutIds: string[];
  wrongMatchIds: string[];
  onWordPress: (wordId: string) => void;
  onLayoutChange: (wordId: string, layout: LayoutRect | null) => void;
  onDragStart: (wordId: string, text: string) => void;
  onDragEnd: (wordId: string) => void;
  onDragUpdate: (
    wordId: string,
    absoluteX: number,
    absoluteY: number,
    translationX: number,
    translationY: number
  ) => void;
  measureSignal?: number;
}

const MatchingColumn = ({
  words,
  isLeftColumn: _isLeftColumn,
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
}: MatchingColumnProps) => {
  const wordLayouts = useRef(new Map<string, LayoutRect>()).current;
  const itemRefs = useRef(new Map<string, MeasurableRef>()).current;

  useEffect(() => {
    const wordIds = new Set(words.map((w) => w.id));
    for (const id of Array.from(wordLayouts.keys())) {
      if (!wordIds.has(id)) {
        wordLayouts.delete(id);
        onLayoutChange(id, null);
      }
    }
    for (const id of Array.from(itemRefs.keys())) {
      if (!wordIds.has(id)) {
        itemRefs.delete(id);
      }
    }
  }, [words, wordLayouts, itemRefs, onLayoutChange]);

  const handleWordLayout = useCallback(
    (wordId: string, layout: LayoutRect) => {
      wordLayouts.set(wordId, layout);
      onLayoutChange(wordId, layout);
    },
    [wordLayouts, onLayoutChange]
  );

  const registerItemRef = useCallback(
    (wordId: string, node: MeasurableRef | null) => {
      if (node) {
        itemRefs.set(wordId, node);
      } else {
        itemRefs.delete(wordId);
      }
    },
    [itemRefs]
  );

  const handleScroll = useCallback(() => {
    for (const [wordId, ref] of itemRefs.entries()) {
      try {
        if (ref?.measureInWindow) {
          ref.measureInWindow((x, y, width, height) => {
            handleWordLayout(wordId, { x, y, width, height });
          });
        }
      } catch {
        // ignore measurement errors
      }
    }
  }, [itemRefs, handleWordLayout]);

  useEffect(() => {
    if (typeof measureSignal !== 'undefined') {
      handleScroll();
    }
  }, [measureSignal, handleScroll]);

  const renderWord: ListRenderItem<MatchingWord> = useCallback(
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
      registerItemRef,
      onDragStart,
      onDragEnd,
      onDragUpdate,
    ]
  );

  return (
    <View style={styles.columnContainer}>
      <FlatList
        data={words}
        renderItem={renderWord}
        keyExtractor={(item) => item.id}
        extraData={{ hoveredId, fadingOutIds, wrongMatchIds, selectedId }}
        onScroll={() => handleScroll()}
        scrollEventThrottle={100}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        bounces={false}
        contentContainerStyle={styles.flatListContent}
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
