import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';



const MatchingWordItem = React.memo(({
  item,
  isSelected,
  isHovered,
  isFadingOut,
  isWrongMatch,
  onWordPress,
  handleWordLayout,
  onDragStart,
  onDragEnd,
  onDragUpdate,
}) => {
  const dragOffset = useSharedValue({ x: 0, y: 0 });
  const isDragging = useSharedValue(false);
  const opacity = useSharedValue(1);

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
      scheduleOnRN(onDragUpdate, item.id, event.absoluteX, event.absoluteY);
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
        style={[styles.wordContainer, animatedStyle]}
        onLayout={(e) => {
          handleWordLayout(item.id, e.nativeEvent.layout);
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
}) => {
  const wordLayouts = useRef(new Map()).current;

  const handleWordLayout = useCallback(
    (wordId, layout) => {
      wordLayouts.set(wordId, layout);
      onLayoutChange(wordId, layout);
    },
    [wordLayouts, onLayoutChange]
  );

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
    <View style={styles.columnContainer}>
      <FlatList
        data={words}
        renderItem={renderWord}
        keyExtractor={(item) => item.id}
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
