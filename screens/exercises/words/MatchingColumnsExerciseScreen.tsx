import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MatchingColumn from '../../../components/words/MatchingColumn';
import DragOverlay from '../../../components/tables/DragOverlay';
import type { RootStackScreenProps } from '../../../navigation/types';
import type { FeedbackMessage, LayoutRect, DragPosition } from '../../../types/ui';
import {
  createMatchingColumnsExercise,
  getWordsForTopics,
  type MatchingColumnsExercise,
} from '../../../utils/domain';

type Props = RootStackScreenProps<'MatchingColumnsExercise'>;

const MatchingColumnsExerciseScreen = ({ navigation, route }: Props) => {
  const { selectedTopics } = route.params || {};

  const words = getWordsForTopics(selectedTopics || ['greetings']);
  const [exerciseState, setExerciseState] = useState<MatchingColumnsExercise>(() =>
    createMatchingColumnsExercise(words, 'native-to-studied')
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [wrongMatchIds, setWrongMatchIds] = useState<string[]>([]);
  const [fadingOutIds, setFadingOutIds] = useState<string[]>([]);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<DragPosition>({ x: 0, y: 0 });
  const [measureSignal, setMeasureSignal] = useState(0);

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongMatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftWordLayouts = useRef(new Map<string, LayoutRect>()).current;
  const rightWordLayouts = useRef(new Map<string, LayoutRect>()).current;
  const dragStartLayoutsRef = useRef(new Map<string, LayoutRect>());
  const rafRef = useRef<number | null>(null);

  const showFeedbackMessage = (message: FeedbackMessage) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedbackMessage(message);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, 2000);
  };

  const handleLayoutChange = useCallback(
    (isLeft: boolean) => (wordId: string, layout: LayoutRect | null) => {
      const layouts = isLeft ? leftWordLayouts : rightWordLayouts;
      if (!layout) {
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

  const isCorrectMatch = (leftId: string, rightId: string) => {
    return exerciseState.matches.some(
      ([l, r]) => l === leftId && r === rightId
    );
  };

  const attemptMatch = (leftId: string, rightId: string) => {
    if (isCorrectMatch(leftId, rightId)) {
      setFadingOutIds((prev) => [...prev, leftId, rightId]);

      setTimeout(() => {
        setExerciseState((prev) => {
          const newCurrentMatches = [...prev.currentMatches, [leftId, rightId] as [string, string]];
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
      setWrongMatchIds([leftId, rightId]);
      showFeedbackMessage({ type: 'error', text: 'Wrong match! Try again!' });

      if (wrongMatchTimeoutRef.current) {
        clearTimeout(wrongMatchTimeoutRef.current);
      }
      wrongMatchTimeoutRef.current = setTimeout(() => {
        setWrongMatchIds([]);
      }, 2000);
      return false;
    }
  };

  const handleWordPress = (wordId: string) => {
    if (exerciseState.currentMatches.some(([l, r]) => l === wordId || r === wordId)) {
      return;
    }

    const isLeftWord = exerciseState.leftWords.some((w) => w.id === wordId);
    const isRightWord = exerciseState.rightWords.some((w) => w.id === wordId);

    if (isLeftWord) {
      if (selectedLeft === wordId) {
        setSelectedLeft(null);
      } else {
        setSelectedLeft(wordId);
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
        setSelectedRight(null);
      } else {
        setSelectedRight(wordId);
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

  const visibleLeftWords = exerciseState.leftWords.filter(
    (w) => !exerciseState.currentMatches.some(([l]) => l === w.id)
  );

  const visibleRightWords = exerciseState.rightWords.filter(
    (w) => !exerciseState.currentMatches.some(([, r]) => r === w.id)
  );

  const getProgressPercentage = () => {
    return Math.round((exerciseState.score / exerciseState.total) * 100);
  };

  const handleDragStart = useCallback((id: string, text: string) => {
    const isLeftDrag = exerciseState.leftWords.some((w) => w.id === id);
    if (isLeftDrag) {
      setSelectedLeft(id);
      setSelectedRight(null);
    } else {
      setSelectedRight(id);
      setSelectedLeft(null);
    }
    const startLayouts = isLeftDrag ? leftWordLayouts : rightWordLayouts;
    const startLayout = startLayouts.get(id);
    if (startLayout) {
      dragStartLayoutsRef.current.set(id, startLayout);
    }
    setDraggedWord(text);
  }, [exerciseState.leftWords, leftWordLayouts, rightWordLayouts]);

  const handleDragUpdate = useCallback((
    id: string,
    absX: number,
    absY: number,
    translationX: number,
    translationY: number
  ) => {
    const start = dragStartLayoutsRef.current.get(id);
    let px = absX;
    let py = absY;
    if (start && typeof translationX === 'number' && typeof translationY === 'number') {
      px = start.x + translationX;
      py = start.y + translationY;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setDragPosition({ x: px, y: py });

      const isLeftDrag = exerciseState.leftWords.some((w) => w.id === id);
      const targetLayouts = isLeftDrag ? rightWordLayouts : leftWordLayouts;

      let foundHovered: string | null = null;
      for (const [wordId, layout] of targetLayouts.entries()) {
        if (!layout) continue;
        if (
          px >= layout.x &&
          px <= layout.x + layout.width &&
          py >= layout.y &&
          py <= layout.y + layout.height
        ) {
          foundHovered = wordId;
          break;
        }
      }

      setHoveredId(foundHovered);
    });
  }, [exerciseState, leftWordLayouts, rightWordLayouts]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleDragEnd = useCallback((id: string) => {
    if (hoveredId != null) {
      const isLeftDrag = exerciseState.leftWords.some((w) => w.id === id);
      let leftId: string;
      let rightId: string;
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

      <View style={styles.columnsContainer}>
        <MatchingColumn
          words={visibleLeftWords}
          isLeftColumn={true}
          selectedId={selectedLeft}
          hoveredId={hoveredId && exerciseState.leftWords.some((w) => w.id === hoveredId) ? hoveredId : null}
          fadingOutIds={fadingOutIds}
          wrongMatchIds={wrongMatchIds}
          onWordPress={handleWordPress}
          onLayoutChange={handleLayoutChange(true)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragUpdate={handleDragUpdate}
          measureSignal={measureSignal}
          dragPosition={dragPosition}
        />

        <View style={styles.divider} />

        <MatchingColumn
          words={visibleRightWords}
          isLeftColumn={false}
          selectedId={selectedRight}
          hoveredId={hoveredId && exerciseState.rightWords.some((w) => w.id === hoveredId) ? hoveredId : null}
          fadingOutIds={fadingOutIds}
          wrongMatchIds={wrongMatchIds}
          onWordPress={handleWordPress}
          onLayoutChange={handleLayoutChange(false)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragUpdate={handleDragUpdate}
          measureSignal={measureSignal}
          dragPosition={dragPosition}
        />
      </View>

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
    paddingVertical: 15,
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
