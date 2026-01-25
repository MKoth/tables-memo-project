import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated as RNAnimated,
} from 'react-native';

const MatchingColumn = ({
  words,
  isLeftColumn,
  selectedId,
  hoveredId,
  fadingOutIds,
  wrongMatchIds,
  onWordPress,
  onLayoutChange,
}) => {
  const wordLayouts = useRef(new Map()).current;
  const fadeAnimValues = useRef(new Map()).current;

  // Initialize fade animation values for each word
  words.forEach((word) => {
    if (!fadeAnimValues.has(word.id)) {
      fadeAnimValues.set(word.id, new RNAnimated.Value(1));
    }
  });

  // Update fade animations when fadingOutIds changes
  useEffect(() => {
    words.forEach((word) => {
      const fadeAnim = fadeAnimValues.get(word.id);
      if (fadeAnim) {
        const isFadingOut = fadingOutIds.includes(word.id);
        RNAnimated.timing(fadeAnim, {
          toValue: isFadingOut ? 0 : 1,
          duration: isFadingOut ? 300 : 0,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [fadingOutIds]);

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
      const fadeAnim = fadeAnimValues.get(item.id) || new RNAnimated.Value(1);

      return (
        <RNAnimated.View
          style={[
            styles.wordContainer,
            {
              opacity: fadeAnim,
            },
          ]}
          onLayout={(e) => {
            handleWordLayout(item.id, {
              x: e.nativeEvent.layout.x,
              y: e.nativeEvent.layout.y,
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            });
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
        </RNAnimated.View>
      );
    },
    [
      selectedId,
      hoveredId,
      fadingOutIds,
      wrongMatchIds,
      fadeAnimValues,
      handleWordLayout,
      onWordPress,
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
