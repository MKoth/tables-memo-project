import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import ScrollableTable from '../../../components/tables/ScrollableTable';
import TransformationWorkspace from '../../../components/tables/TransformationWorkspace';
import {
  sampleSpanishTable,
  createWordTransformationExercise,
  OPERATION_TYPES,
  type WordOperationSequence,
  type WordTransformationExercise,
} from '../../../utils/domain';

type SequenceWithHint = WordOperationSequence & { showHint?: boolean };
import type { RootStackScreenProps } from '../../../navigation/types';
import type { FeedbackMessage, LayoutRect, ScrollableTableHandle, ScrollWorkspaceHandle } from '../../../types/ui';

type Props = RootStackScreenProps<'WordTransformationExercise'>;

const WordTransformationExerciseScreen = ({ navigation }: Props) => {
  const [exerciseState, setExerciseState] = useState<WordTransformationExercise>(() =>
    createWordTransformationExercise(sampleSpanishTable)
  );
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [selectedLetters, setSelectedLetters] = useState<Set<number>>(new Set());
  const [inputText, setInputText] = useState('');
  const [showVariants, setShowVariants] = useState(false);
  const [animatingWord, setAnimatingWord] = useState<string | null>(null);
  const [justCompletedTransformation, setJustCompletedTransformation] = useState(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flyingWordPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingWordScale = useRef(new Animated.Value(1)).current;
  const cellLayouts = useRef(new Map<string, LayoutRect>());
  const wordDisplayRef = useRef<View>(null);
  const tableScrollRef = useRef<ScrollableTableHandle>(null);
  const workspaceScrollRef = useRef<ScrollWorkspaceHandle>(null);

  const currentSequence = exerciseState.sequences[exerciseState.currentSequenceIndex];
  const currentOperation = currentSequence?.operations[currentSequence.currentOperation];

  const showFeedbackMessage = (message: FeedbackMessage) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedbackMessage(message);

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 2000);
  };

  const getGlobalPosition = (ref: React.RefObject<View | null>): Promise<LayoutRect | null> => {
    return new Promise((resolve) => {
      if (ref?.current) {
        ref.current.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    });
  };

  const animateWordToCell = async (word: string, cellRow: number, cellCol: number): Promise<void> => {
    const startPos = await getGlobalPosition(wordDisplayRef);
    const cellKey = `${cellRow}-${cellCol}`;
    const cellLayout = cellLayouts.current.get(cellKey);

    if (!startPos || !cellLayout) {
      console.warn('Could not measure positions for word animation');
      return;
    }

    const headerHeight = 64;

    flyingWordPosition.setValue({ x: startPos.x, y: startPos.y - headerHeight });
    flyingWordScale.setValue(1);

    return new Promise((resolve) => {
      Animated.parallel([
        Animated.timing(flyingWordPosition, {
          toValue: { x: cellLayout.x, y: cellLayout.y - headerHeight },
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        resolve();
      });
    });
  };

  const onTransformationComplete = async (row: number, col: number, word: string) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollToCell(row, col);
    }

    if (workspaceScrollRef.current) {
      workspaceScrollRef.current.scrollTo({ y: 0, animated: true });
    }

    await new Promise<void>(resolve => setTimeout(resolve, 300));

    setAnimatingWord(word);

    try {
      await animateWordToCell(word, row, col);

      setExerciseState(prev => {
        const newCells = prev.table.cells.map((cellRow, rowIndex) =>
          cellRow.map((cell, colIndex) => {
            if (rowIndex === row && colIndex === col) {
              return {
                ...cell,
                currentValue: word,
                isFilled: true,
                isCorrect: true,
              };
            }
            return cell;
          })
        );

        return {
          ...prev,
          table: { ...prev.table, cells: newCells },
        };
      });

      setJustCompletedTransformation(true);

      showFeedbackMessage({ type: 'success', text: 'Perfect!!!' });
    } catch (e) {
      console.error(e);
    } finally {
      setAnimatingWord(null);
      flyingWordScale.setValue(1);
    }
  };

  const registerCellLayout = (row: number, col: number, layout: LayoutRect) => {
    cellLayouts.current.set(`${row}-${col}`, layout);
  };

  const handleLetterPress = (_letter: string, index: number) => {
    if (currentOperation?.type !== OPERATION_TYPES.DELETE) return;

    const newSelected = new Set(selectedLetters);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLetters(newSelected);
  };

  const handleSubmitRemoval = async () => {
    if (currentOperation?.type !== OPERATION_TYPES.DELETE) return;

    const selectedIndexes = Array.from(selectedLetters).sort((a, b) => a - b);
    const expectedStartIndex = currentOperation.index;
    const expectedLength = currentOperation.length;
    const expectedIndexes = Array.from({ length: expectedLength }, (_, i) => expectedStartIndex + i);

    const indexesMatch = selectedIndexes.length === expectedIndexes.length &&
      selectedIndexes.every((index, i) => index === expectedIndexes[i]);

    if (indexesMatch) {
      const before = currentSequence.currentWord.slice(0, currentOperation.index);
      const after = currentSequence.currentWord.slice(currentOperation.index + currentOperation.length);
      const newWord = before + after;

      updateCurrentWord(newWord);
      const sequenceCompleted = advanceOperation();

      if (sequenceCompleted) {
        const completedWord = newWord;
        await onTransformationComplete(currentSequence.rowIndex, currentSequence.colIndex, completedWord);
      } else {
        showFeedbackMessage({ type: 'success', text: 'Great job!!!' });
      }
    } else {
      showFeedbackMessage({ type: 'error', text: 'Wrong selection! Try again.' });
    }

    setSelectedLetters(new Set());
  };

  const handleVariantSelect = async (variant: string) => {
    if (currentOperation?.type !== OPERATION_TYPES.INSERT) return;

    if (variant === currentOperation.text) {
      const before = currentSequence.currentWord.slice(0, currentOperation.index);
      const after = currentSequence.currentWord.slice(currentOperation.index);
      const newWord = before + variant + after;

      updateCurrentWord(newWord);
      const sequenceCompleted = advanceOperation();

      if (sequenceCompleted) {
        const completedWord = newWord;
        await onTransformationComplete(currentSequence.rowIndex, currentSequence.colIndex, completedWord);
      } else {
        showFeedbackMessage({ type: 'success', text: 'Perfect!!!' });
      }
    } else {
      showFeedbackMessage({ type: 'error', text: 'Wrong choice! Try again.' });
    }

    setShowVariants(false);
  };

  const updateCurrentWord = (newWord: string) => {
    setExerciseState(prev => ({
      ...prev,
      sequences: prev.sequences.map((seq, index) =>
        index === prev.currentSequenceIndex
          ? { ...seq, currentWord: newWord }
          : seq
      )
    }));
  };

  const advanceOperation = (): boolean => {
    const willCompleteSequence = currentSequence.currentOperation >= currentSequence.operations.length - 1;

    setExerciseState(prev => {
      const newSequences = [...prev.sequences];
      const currentSeq = newSequences[prev.currentSequenceIndex];

      if (currentSeq.currentOperation < currentSeq.operations.length - 1) {
        currentSeq.currentOperation += 1;
      } else {
        currentSeq.isCompleted = true;
        const nextIndex = prev.currentSequenceIndex + 1;

        if (nextIndex >= prev.sequences.length) {
          return {
            ...prev,
            sequences: newSequences,
            currentSequenceIndex: nextIndex - 1,
            isCompleted: true
          };
        } else {
          return {
            ...prev,
            sequences: newSequences,
            currentSequenceIndex: nextIndex
          };
        }
      }

      return {
        ...prev,
        sequences: newSequences
      };
    });

    return willCompleteSequence;
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Exercise',
      'Are you sure you want to reset the exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setExerciseState(createWordTransformationExercise(sampleSpanishTable));
            setSelectedLetters(new Set());
            setInputText('');
            setShowVariants(false);
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (justCompletedTransformation) {
      const newSequence = exerciseState.sequences[exerciseState.currentSequenceIndex];
      if (newSequence && tableScrollRef.current) {
        tableScrollRef.current.scrollToCell(newSequence.rowIndex, newSequence.colIndex);
      }
      setJustCompletedTransformation(false);
    }
  }, [exerciseState.currentSequenceIndex, justCompletedTransformation]);

  const getCurrentCell = () => {
    const sequence = exerciseState.sequences[exerciseState.currentSequenceIndex];
    if (!sequence) return null;

    return exerciseState.table.cells[sequence.rowIndex]?.[sequence.colIndex];
  };

  if (exerciseState.isCompleted) {
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionTitle}>Congratulations! 🎉</Text>
        <Text style={styles.completionText}>
          You have completed all word transformations!
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Exercises</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCell = getCurrentCell();

  return (
    <View style={styles.container}>
      {animatingWord && (
        <Animated.View
          style={[
            styles.flyingWord,
            {
              left: 0,
              top: 0,
              transform: [
                { translateX: flyingWordPosition.x },
                { translateY: flyingWordPosition.y },
                { scale: flyingWordScale },
              ],
            },
          ]}
        >
          <Text style={styles.flyingWordText}>{animatingWord}</Text>
        </Animated.View>
      )}

      {feedbackMessage && (
        <View style={[
          styles.feedbackContainer,
          feedbackMessage.type === 'error' && styles.errorFeedback,
          feedbackMessage.type === 'success' && styles.successFeedback,
        ]}>
          <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
        </View>
      )}

      <View style={styles.tableContainer}>
        <ScrollableTable
          ref={tableScrollRef}
          table={exerciseState.table}
          onCellPress={() => {}}
          showAnswers={false}
          wrongCell={null}
          getCellIsHovered={() => false}
          registerCellLayout={registerCellLayout}
          draggedVariant={null}
          dragPosition={{ x: 0, y: 0 }}
          blinkingCell={currentCell}
        />
      </View>

      <TransformationWorkspace
        ref={workspaceScrollRef}
        sequence={currentSequence}
        operation={currentOperation}
        selectedLetters={selectedLetters}
        showVariants={showVariants}
        wordDisplayRef={wordDisplayRef}
        onLetterPress={handleLetterPress}
        onHintToggle={() => {
          setExerciseState(prev => ({
            ...prev,
            sequences: prev.sequences.map((seq, index) => {
              const seqWithHint = seq as SequenceWithHint;
              return index === prev.currentSequenceIndex
                ? { ...seqWithHint, showHint: !seqWithHint.showHint }
                : seqWithHint;
            })
          }));
        }}
        onSubmitRemoval={handleSubmitRemoval}
        onVariantSelect={handleVariantSelect}
        onShowVariants={() => setShowVariants(true)}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReset}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'ComicSansMS',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'ComicSansMS',
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 10,
  },

  buttonContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'ComicSansMS',
  },
  secondaryButtonText: {
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
  },
  errorFeedback: {
    backgroundColor: '#ffebee',
  },
  successFeedback: {
    backgroundColor: '#e8f5e8',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  completionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'ComicSansMS',
  },
  backButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'ComicSansMS',
  },
  flyingWord: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#9ed69e',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 2000,
    justifyContent: 'center',
    width: 80,
    height: 40,
  },
  flyingWordText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'normal',
    fontFamily: 'ComicSansMS',
  },
});

export default WordTransformationExerciseScreen;
