import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MatchingColumn from '../../../components/words/MatchingColumn';
import DragOverlay from '../../../components/tables/DragOverlay';
import { createMatchingColumnsExercise, getWordsForTopics } from '../../../utils/types';

const MatchingColumnsExerciseScreen = ({ navigation, route }) => {
  const { selectedLanguage, selectedTopics } = route.params || {};

  // Get words and initialize exercise with native-to-studied direction
  const words = getWordsForTopics(selectedTopics || ['greetings']);
  const [exerciseState, setExerciseState] = useState(() =>
    createMatchingColumnsExercise(words, 'native-to-studied')
  );

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [wrongMatchIds, setWrongMatchIds] = useState([]);
  const [fadingOutIds, setFadingOutIds] = useState([]);
  const [draggedWord, setDraggedWord] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [measureSignal, setMeasureSignal] = useState(0);

  const feedbackTimeoutRef = useRef(null);
  const wrongMatchTimeoutRef = useRef(null);
  const leftWordLayouts = useRef(new Map()).current;
  const rightWordLayouts = useRef(new Map()).current;
  const dragStartLayoutsRef = useRef(new Map());

  // Show feedback message for 2 seconds
  const showFeedbackMessage = (message) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedbackMessage(message);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, 2000);
  };

  // Register word layout
  const handleLayoutChange = useCallback(
    (isLeft) => (wordId, layout) => {
      const layouts = isLeft ? leftWordLayouts : rightWordLayouts;
      if (!layout) {
        // remove layout when word disappears
        layouts.delete(wordId);
        return;
      }
      layouts.set(wordId, {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });
    },
    [leftWordLayouts, rightWordLayouts]
  );

  // Check if two words are a correct match
  const isCorrectMatch = (leftId, rightId) => {
    return exerciseState.matches.some(
      ([l, r]) => l === leftId && r === rightId
    );
  };

  // Handle word press (click selection)
  const handleWordPress = (wordId) => {
    // Check if word is already matched
    if (exerciseState.currentMatches.some(([l, r]) => l === wordId || r === wordId)) {
      return;
    }

    const isLeftWord = exerciseState.leftWords.some(w => w.id === wordId);
    const isRightWord = exerciseState.rightWords.some(w => w.id === wordId);

    if (isLeftWord) {
      if (selectedLeft === wordId) {
        // Deselect
        setSelectedLeft(null);
      } else {
        // Select left word
        setSelectedLeft(wordId);
        // If right is already selected, attempt match
        if (selectedRight) {
          const isCorrect = attemptMatch(wordId, selectedRight);
          if (isCorrect) {
            setSelectedLeft(null);
            setSelectedRight(null);
          } else {
            setSelectedLeft(null);
          }
        }
      }
    } else if (isRightWord) {
      if (selectedRight === wordId) {
        // Deselect
        setSelectedRight(null);
      } else {
        // Select right word
        setSelectedRight(wordId);
        // If left is already selected, attempt match
        if (selectedLeft) {
          const isCorrect = attemptMatch(selectedLeft, wordId);
          if (isCorrect) {
            setSelectedLeft(null);
            setSelectedRight(null);
          } else {
            setSelectedRight(null);
          }
        }
      }
    }
  };

  // Attempt to match two words
  const attemptMatch = (leftId, rightId) => {
    if (isCorrectMatch(leftId, rightId)) {
      // Correct match - fade out animation
      setFadingOutIds((prev) => [...prev, leftId, rightId]);

      // After fade-out animation (300ms), remove from state
      setTimeout(() => {
        setExerciseState((prev) => {
          const newCurrentMatches = [...prev.currentMatches, [leftId, rightId]];
          const isCompleted = newCurrentMatches.length === prev.total;

          return {
            ...prev,
            currentMatches: newCurrentMatches,
            score: newCurrentMatches.length,
            isCompleted,
          };
        });

        setFadingOutIds((prev) =>
          prev.filter((id) => id !== leftId && id !== rightId)
        );

          // Trigger re-measure of remaining items (positions changed)
          setMeasureSignal((s) => s + 1);

        showFeedbackMessage({ type: 'success', text: 'Great job!!!' });

        if (
          exerciseState.currentMatches.length + 1 === exerciseState.total
        ) {
          showFeedbackMessage({
            type: 'completion',
            text: 'Well done!!! All pairs matched!',
          });
        }
      }, 300);

      return true;
    } else {
      // Wrong match - show error on both words
      setWrongMatchIds([leftId, rightId]);
      showFeedbackMessage({ type: 'error', text: "Wrong match! Try again!" });

      if (wrongMatchTimeoutRef.current) {
        clearTimeout(wrongMatchTimeoutRef.current);
      }
      wrongMatchTimeoutRef.current = setTimeout(() => {
        setWrongMatchIds([]);
      }, 2000);
      return false;
    }
  };

  // Handle word press (click selection)
  const visibleLeftWords = exerciseState.leftWords.filter(
    (w) => !exerciseState.currentMatches.some(([l]) => l === w.id)
  );

  const visibleRightWords = exerciseState.rightWords.filter(
    (w) => !exerciseState.currentMatches.some(([, r]) => r === w.id)
  );

  const getProgressPercentage = () => {
    return Math.round((exerciseState.score / exerciseState.total) * 100);
  };

  // Drag event handlers
  const handleDragStart = useCallback((id, text) => {
    const isLeftDrag = exerciseState.leftWords.some(w => w.id === id);
    if (isLeftDrag) {
      setSelectedLeft(id);
      setSelectedRight(null);
    } else {
      setSelectedRight(id);
      setSelectedLeft(null);
    }
    // Store the starting layout for this dragged item (if available)
    const startLayouts = isLeftDrag ? leftWordLayouts : rightWordLayouts;
    const startLayout = startLayouts.get(id);
    if (startLayout) {
      dragStartLayoutsRef.current.set(id, startLayout);
    }
    setDraggedWord(text);
  }, [exerciseState.leftWords, leftWordLayouts, rightWordLayouts]);

  const handleDragUpdate = useCallback((id, absX, absY, translationX, translationY) => {
    // Compute position from the stored start layout + translation if available
    const start = dragStartLayoutsRef.current.get(id);
    let px = absX;
    let py = absY;
    if (start && typeof translationX === 'number' && typeof translationY === 'number') {
      px = start.x + translationX;
      py = start.y + translationY;
    }

    setDragPosition({ x: px, y: py });

    // Determine which column the drag originated from (check current visible words)
    const isLeftDrag = exerciseState.leftWords.some(w => w.id === id);
    const targetLayouts = isLeftDrag ? rightWordLayouts : leftWordLayouts;

    let foundHovered = null;
    for (const [wordId, layout] of targetLayouts.entries()) {
      if (!layout) continue;
      if (
        absX >= layout.x &&
        absX <= layout.x + layout.width &&
        absY >= layout.y &&
        absY <= layout.y + layout.height
      ) {
        foundHovered = wordId;
        break;
      }
    }

    setHoveredId(foundHovered);
  }, [exerciseState, leftWordLayouts, rightWordLayouts]);

  const handleDragEnd = useCallback((id) => {
    if (hoveredId != null) {
      const isLeftDrag = exerciseState.leftWords.some(w => w.id === id);
      let leftId, rightId;
      if (isLeftDrag) {
        leftId = id;
        rightId = hoveredId;
      } else {
        leftId = hoveredId;
        rightId = id;
      }

      const matched = attemptMatch(leftId, rightId);
      if (matched) {
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        if (isLeftDrag) {
          setSelectedLeft(null);
        } else {
          setSelectedRight(null);
        }
      }
    }

    setDraggedWord(null);
    setDragPosition({ x: 0, y: 0 });
    setHoveredId(null);
    // cleanup stored start layout
    dragStartLayoutsRef.current.delete(id);
  }, [exerciseState.leftWords, hoveredId, attemptMatch]);

  if (exerciseState.isCompleted) {
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionTitle}>🎉 Excellent Work!</Text>
        <Text style={styles.completionSubtitle}>
          You matched all {exerciseState.total} pairs perfectly!
        </Text>

        <View style={styles.statsBox}>
          <Text style={styles.statText}>
            Score: {exerciseState.score}/{exerciseState.total}
          </Text>
          <Text style={styles.statText}>
            Accuracy: {getProgressPercentage()}%
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            const newWords = getWordsForTopics(
              selectedTopics || ['greetings']
            );
            setExerciseState(
              createMatchingColumnsExercise(newWords, 'native-to-studied')
            );
            setSelectedLeft(null);
            setSelectedRight(null);
            setFadingOutIds([]);
          }}
        >
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Back to Exercises</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Match the Columns</Text>
      </View>

      {/* Feedback message */}
      {feedbackMessage && (
        <View
          style={[
            styles.feedbackMessage,
            feedbackMessage.type === 'success' && styles.feedbackSuccess,
            feedbackMessage.type === 'error' && styles.feedbackError,
            feedbackMessage.type === 'completion' && styles.feedbackCompletion,
          ]}
        >
          <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
        </View>
      )}

      {/* Two column layout */}
      <View style={styles.columnsContainer}>
        <MatchingColumn
          words={visibleLeftWords}
          isLeftColumn={true}
          selectedId={selectedLeft}
          hoveredId={hoveredId && exerciseState.leftWords.some(w => w.id === hoveredId) ? hoveredId : null}
          fadingOutIds={fadingOutIds}
          wrongMatchIds={wrongMatchIds}
          onWordPress={handleWordPress}
          onLayoutChange={handleLayoutChange(true)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragUpdate={handleDragUpdate}
          measureSignal={measureSignal}
        />

        <View style={styles.divider} />

        <MatchingColumn
          words={visibleRightWords}
          isLeftColumn={false}
          selectedId={selectedRight}
          hoveredId={hoveredId && exerciseState.rightWords.some(w => w.id === hoveredId) ? hoveredId : null}
          fadingOutIds={fadingOutIds}
          wrongMatchIds={wrongMatchIds}
          onWordPress={handleWordPress}
          onLayoutChange={handleLayoutChange(false)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragUpdate={handleDragUpdate}
          measureSignal={measureSignal}
        />
      </View>

      {/* Drag Overlay */}
      <DragOverlay
        draggedVariant={draggedWord}
        dragPosition={dragPosition}
        isDragging={!!draggedWord}
        customVariantStyles={{
          paddingHorizontal: 15,
          paddingVertical: 12,
          borderRadius: 8,
          minHeight: 46,
          width: Dimensions.get('window').width / 2 - 45,
          alignItems: 'flex-start',
        }}
        customTextStyles={{
          textAlign: 'left',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  feedbackMessage: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  feedbackSuccess: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  feedbackError: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#f5222d',
  },
  feedbackCompletion: {
    backgroundColor: '#cfe9f3',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'ComicSansMS',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  statsBox: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 8,
    fontFamily: 'ComicSansMS',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'ComicSansMS',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
});

export default MatchingColumnsExerciseScreen;
