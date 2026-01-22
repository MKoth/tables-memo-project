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
import TransformationWorkspace from '../../../components/tables/TransformationWorkspace';
import CircularCountdown from '../../../components/shared/CircularCountdown';
import { sampleSpanishTable, createSentenceFittingExercise, OPERATION_TYPES, sentenceTemplates } from '../../../utils/types';

const COUNTDOWN_DURATION = 5;

const SentenceFittingExerciseScreen = ({ navigation }) => {
  const [exerciseState, setExerciseState] = useState(() =>
    createSentenceFittingExercise(sampleSpanishTable)
  );
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [selectedLetters, setSelectedLetters] = useState(new Set());
  const [showVariants, setShowVariants] = useState(false);
  const [animatingWord, setAnimatingWord] = useState(null);
  const [showingCompletedSentence, setShowingCompletedSentence] = useState(false);
  const [currentSentenceText, setCurrentSentenceText] = useState('');
  const [autoAdvanceTimeoutId, setAutoAdvanceTimeoutId] = useState(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const feedbackTimeoutRef = useRef(null);

  // Animation refs
  const flyingWordPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingWordScale = useRef(new Animated.Value(1)).current;
  const wordDisplayRef = useRef(null);
  const sentenceDisplayRef = useRef(null);
  const workspaceScrollRef = useRef(null);

  // Current sequence and operation
  const currentSequence = exerciseState.sequences[exerciseState.currentSequenceIndex];
  const currentOperation = currentSequence?.operations[currentSequence.currentOperation];

  useEffect(() => {
    if (currentSequence) {
      const template = sentenceTemplates[currentSequence.sentenceIndex];
      setCurrentSentenceText(template);
    }
  }, [currentSequence]);

  // Countdown effect
  useEffect(() => {
    let intervalId;
    if (showingCompletedSentence && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showingCompletedSentence, countdown]);

  // Reset countdown when advancing
  useEffect(() => {
    if (!showingCompletedSentence) {
      setCountdown(COUNTDOWN_DURATION);
    }
  }, [showingCompletedSentence]);

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

  const getGlobalPosition = (ref) => {
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

  const animateWordToSentence = async (word) => {
    const startPos = await getGlobalPosition(wordDisplayRef);
    const sentencePos = await getGlobalPosition(sentenceDisplayRef);

    if (!startPos || !sentencePos) {
      console.warn('Could not measure positions for word animation');
      return;
    }

    const headerHeight = 64;

    // Set initial position and scale
    flyingWordPosition.setValue({ x: startPos.x, y: startPos.y - headerHeight });
    flyingWordScale.setValue(1);

    return new Promise((resolve) => {
      Animated.parallel([
        Animated.timing(flyingWordPosition, {
          toValue: { x: sentencePos.x, y: sentencePos.y - headerHeight },
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        resolve();
      });
    });
  };

  const onTransformationComplete = async (word) => {
    // Scroll workspace to top
    if (workspaceScrollRef.current) {
      workspaceScrollRef.current.scrollTo({ y: 0, animated: true });
    }

    // Wait for scroll
    await new Promise(resolve => setTimeout(resolve, 300));

    // Start animation
    setAnimatingWord(word);

    try {
      await animateWordToSentence(word);

      // Update sentence with the word
      const template = sentenceTemplates[currentSequence.sentenceIndex];
      const completedSentence = template.replace('_____', word);
      setCurrentSentenceText(completedSentence);

      // Show completed sentence
      setShowingCompletedSentence(true);

      // Auto-advance after 10 seconds, or user can click Next
      const timeoutId = setTimeout(() => {
        advanceToNextSequence();
      }, COUNTDOWN_DURATION * 1000);

      // Store timeout ID for cleanup
      setAutoAdvanceTimeoutId(timeoutId);

    } catch (e) {
      console.error(e);
    } finally {
      setAnimatingWord(null);
      flyingWordScale.setValue(1);
    }
  };

  const advanceToNextSequence = () => {
    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeoutId) {
      clearTimeout(autoAdvanceTimeoutId);
      setAutoAdvanceTimeoutId(null);
    }

    setShowingCompletedSentence(false);

    setExerciseState(prev => {
      const nextIndex = prev.currentSequenceIndex + 1;

      if (nextIndex >= prev.sequences.length) {
        // Exercise completed
        return {
          ...prev,
          currentSequenceIndex: nextIndex - 1,
          isCompleted: true
        };
      } else {
        // Next sequence
        return {
          ...prev,
          currentSequenceIndex: nextIndex
        };
      }
    });

    // Reset states for next sequence
    setSelectedLetters(new Set());
    setShowVariants(false);
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

  const handleSubmitRemoval = async () => {
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
      const sequenceCompleted = advanceOperation();

      if (sequenceCompleted) {
        // Get the completed word before state update
        const completedWord = newWord;
        await onTransformationComplete(completedWord);
      } else {
        showFeedbackMessage({ type: 'success', text: 'Great job!!!' });
      }
    } else {
      showFeedbackMessage({ type: 'error', text: 'Wrong selection! Try again.' });
    }

    setSelectedLetters(new Set());
  };

  const handleVariantSelect = async (variant) => {
    if (currentOperation?.type !== OPERATION_TYPES.INSERT) return;

    if (variant === currentOperation.text) {
      // Correct insertion
      const before = currentSequence.currentWord.slice(0, currentOperation.index);
      const after = currentSequence.currentWord.slice(currentOperation.index);
      const newWord = before + variant + after;

      updateCurrentWord(newWord);
      const sequenceCompleted = advanceOperation();

      if (sequenceCompleted) {
        // Get the completed word before state update
        const completedWord = newWord;
        await onTransformationComplete(completedWord);
      } else {
        showFeedbackMessage({ type: 'success', text: 'Perfect!!!' });
      }
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
    // Check synchronously if this operation will complete the sequence
    const willCompleteSequence = currentSequence.currentOperation >= currentSequence.operations.length - 1;

    setExerciseState(prev => {
      const newSequences = [...prev.sequences];
      const currentSeq = newSequences[prev.currentSequenceIndex];

      if (currentSeq.currentOperation < currentSeq.operations.length - 1) {
        // Next operation in current sequence
        currentSeq.currentOperation += 1;
      } else {
        // Sequence completed
        currentSeq.isCompleted = true;
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
            // Clear any pending auto-advance timeout
            if (autoAdvanceTimeoutId) {
              clearTimeout(autoAdvanceTimeoutId);
              setAutoAdvanceTimeoutId(null);
            }

            setExerciseState(createSentenceFittingExercise(sampleSpanishTable));
            setSelectedLetters(new Set());
            setShowVariants(false);
            setShowingCompletedSentence(false);
            setCurrentSentenceText('');
          },
        },
      ]
    );
  };

  if (exerciseState.isCompleted) {
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionTitle}>Congratulations! 🎉</Text>
        <Text style={styles.completionText}>
          You have completed all sentence fittings!
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

  return (
    <View style={styles.container}>
      {/* Flying Word Animation Overlay */}
      {animatingWord && (
        <Animated.View
          style={[
            styles.flyingWord,
            {
              left: 0, // Will be positioned by transform
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
        <Text style={styles.title}>Sentence Fitting Exercise</Text>
        <Text style={styles.subtitle}>
          Fit words into sentences • Sentence {exerciseState.currentSequenceIndex + 1} of {exerciseState.sequences.length}
        </Text>
      </View>

      {/* Sentence Display */}
      <View style={styles.sentenceContainer}>
        <View
          ref={sentenceDisplayRef}
          style={styles.sentenceTextContainer}
        >
          <Text style={styles.sentenceText}>
            {currentSentenceText}
          </Text>
        </View>
      </View>

      {/* Transformation Workspace */}
      {!showingCompletedSentence && (
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
      )}

      {/* Next Button when showing completed sentence */}
      {showingCompletedSentence && (
        <View style={styles.nextButtonContainer}>
          <Text style={styles.nextWordTitle}>Next word in:</Text>
          <View style={styles.countdownWrapper}>
            <CircularCountdown
              duration={COUNTDOWN_DURATION}
              remainingTime={countdown}
              onComplete={advanceToNextSequence}
              size={120}
              strokeWidth={8}
              color="#4A90E2"
              backgroundColor="#e0e0e0"
            />
          </View>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={advanceToNextSequence}
          >
            <Text style={styles.nextButtonText}>Show Next Word!</Text>
          </TouchableOpacity>
        </View>
      )}

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
  sentenceContainer: {
    padding: 16,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  sentenceTextContainer: {
    alignItems: 'center',
  },
  sentenceText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'ComicSansMS',
  },
  nextButtonContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'center',
  },
  nextWordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'ComicSansMS',
  },
  countdownWrapper: {
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'ComicSansMS',
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
    backgroundColor: '#9ed69e', // Match successful cell green
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

export default SentenceFittingExerciseScreen;
