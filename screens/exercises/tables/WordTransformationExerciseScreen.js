import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ScrollableTable from '../../../components/tables/ScrollableTable';
import TransformationWorkspace from '../../../components/tables/TransformationWorkspace';
import { sampleSpanishTable, createWordTransformationExercise, OPERATION_TYPES, generateWrongVariants } from '../../../utils/types';

const WordTransformationExerciseScreen = ({ navigation }) => {
  const [exerciseState, setExerciseState] = useState(() =>
    createWordTransformationExercise(sampleSpanishTable)
  );
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [selectedLetters, setSelectedLetters] = useState(new Set());
  const [inputText, setInputText] = useState('');
  const [showVariants, setShowVariants] = useState(false);
  const feedbackTimeoutRef = useRef(null);

  // Current sequence and operation
  const currentSequence = exerciseState.sequences[exerciseState.currentSequenceIndex];
  const currentOperation = currentSequence?.operations[currentSequence.currentOperation];

  const showFeedbackMessage = (message) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedbackMessage(message);

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 2000);
  };

  const handleLetterPress = (letter, index) => {
    if (currentOperation?.type !== OPERATION_TYPES.DELETE) return;

    const newSelected = new Set(selectedLetters);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLetters(newSelected);
  };

  const handleSubmitRemoval = () => {
    if (currentOperation?.type !== OPERATION_TYPES.DELETE) return;

    // Convert selected indexes to the actual indexes that need to be deleted
    const selectedIndexes = Array.from(selectedLetters).sort((a, b) => a - b);
    const expectedStartIndex = currentOperation.index;
    const expectedLength = currentOperation.length;
    const expectedIndexes = Array.from({ length: expectedLength }, (_, i) => expectedStartIndex + i);

    const indexesMatch = selectedIndexes.length === expectedIndexes.length &&
      selectedIndexes.every((index, i) => index === expectedIndexes[i]);

    if (indexesMatch) {
      // Correct removal - remove the specified substring
      const before = currentSequence.currentWord.slice(0, currentOperation.index);
      const after = currentSequence.currentWord.slice(currentOperation.index + currentOperation.length);
      const newWord = before + after;

      updateCurrentWord(newWord);
      advanceOperation();
      showFeedbackMessage({ type: 'success', text: 'Great job!!!' });
    } else {
      showFeedbackMessage({ type: 'error', text: 'Wrong selection! Try again.' });
    }

    setSelectedLetters(new Set());
  };

  const handleVariantSelect = (variant) => {
    if (currentOperation?.type !== OPERATION_TYPES.INSERT) return;

    if (variant === currentOperation.text) {
      // Correct insertion
      const before = currentSequence.currentWord.slice(0, currentOperation.index);
      const after = currentSequence.currentWord.slice(currentOperation.index);
      const newWord = before + variant + after;

      updateCurrentWord(newWord);
      advanceOperation();
      showFeedbackMessage({ type: 'success', text: 'Perfect!!!' });
    } else {
      showFeedbackMessage({ type: 'error', text: 'Wrong choice! Try again.' });
    }

    setShowVariants(false);
  };

  const updateCurrentWord = (newWord) => {
    setExerciseState(prev => ({
      ...prev,
      sequences: prev.sequences.map((seq, index) =>
        index === prev.currentSequenceIndex
          ? { ...seq, currentWord: newWord }
          : seq
      )
    }));
  };

  const advanceOperation = () => {
    setExerciseState(prev => {
      const newSequences = [...prev.sequences];
      const currentSeq = newSequences[prev.currentSequenceIndex];

      if (currentSeq.currentOperation < currentSeq.operations.length - 1) {
        // Next operation in current sequence
        currentSeq.currentOperation += 1;
      } else {
        // Sequence completed, move to next cell
        currentSeq.isCompleted = true;
        const nextIndex = prev.currentSequenceIndex + 1;

        if (nextIndex >= prev.sequences.length) {
          // Exercise completed
          return {
            ...prev,
            sequences: newSequences,
            currentSequenceIndex: nextIndex - 1,
            isCompleted: true
          };
        } else {
          // Next sequence
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
      {/* Feedback Message */}
      {feedbackMessage && (
        <View style={[
          styles.feedbackContainer,
          feedbackMessage.type === 'error' && styles.errorFeedback,
          feedbackMessage.type === 'success' && styles.successFeedback,
        ]}>
          <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{exerciseState.table.name}</Text>
        <Text style={styles.subtitle}>
          Transform words step by step • Cell {exerciseState.currentSequenceIndex + 1} of {exerciseState.sequences.length}
        </Text>
      </View>

      {/* Table with blinking cell */}
      <View style={styles.tableContainer}>
        <ScrollableTable
          table={exerciseState.table}
          onCellPress={() => {}} // Read-only for this exercise
          showAnswers={false}
          wrongCell={null}
          getCellIsHovered={() => false}
          registerCellLayout={() => {}}
          draggedVariant={null}
          dragPosition={{ x: 0, y: 0 }}
          blinkingCell={currentCell}
        />
      </View>

      {/* Transformation Workspace */}
      <TransformationWorkspace
        sequence={currentSequence}
        operation={currentOperation}
        selectedLetters={selectedLetters}
        showVariants={showVariants}
        onLetterPress={handleLetterPress}
        onHintToggle={() => {
          setExerciseState(prev => ({
            ...prev,
            sequences: prev.sequences.map((seq, index) =>
              index === prev.currentSequenceIndex
                ? { ...seq, showHint: !seq.showHint }
                : seq
            )
          }));
        }}
        onSubmitRemoval={handleSubmitRemoval}
        onVariantSelect={handleVariantSelect}
        onShowVariants={() => setShowVariants(true)}
      />

      {/* Action Buttons */}
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
    maxHeight: '40%',
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
});

export default WordTransformationExerciseScreen;
