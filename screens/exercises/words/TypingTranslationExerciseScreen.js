import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getWordsForTopics, createTypingExercise } from '../../../utils/types';
import transliterate from '@sindresorhus/transliterate';

function normalizeForComparison(str) {
  return transliterate(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")                     // separate accents
    .replace(/[\u0300-\u036f]/g, "")      // remove accents
    .replace(/[^\p{L}\p{N}\s]/gu, "")     // remove punctuation & symbols
    .replace(/\s+/g, " ");                // collapse multiple spaces
}

const TypingTranslationExerciseScreen = ({ route }) => {
  const { selectedLanguage, learningType, selectedTopics } = route.params || {};
  
  // State for direction selection
  const [direction, setDirection] = useState(null); // 'native-to-studied' or 'studied-to-native'
  const [exercise, setExercise] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const feedbackTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize exercise when direction is selected
  useEffect(() => {
    if (direction && !exercise) {
      const words = getWordsForTopics(selectedTopics);
      const newExercise = createTypingExercise(words, direction);
      setExercise(newExercise);
      setCurrentQuestion(newExercise.questions[0]);
      setUserInput('');
    }
  }, [direction, exercise, selectedTopics]);

  // Auto-focus input when question changes
  useEffect(() => {
    if (currentQuestion && inputRef.current) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        inputRef.current.focus();
        setIsInputFocused(true);
      }, 100);
    }
  }, [currentQuestion]);

  // Handle input submission
  const handleSubmit = () => {
    if (!currentQuestion || !userInput.trim()) return;

    // Use Unicode normalization for accent-sensitive comparison
    const normalizedInput = normalizeForComparison(userInput);
    const normalizedAnswer = normalizeForComparison(currentQuestion.correctAnswer);
    const correct = normalizedInput === normalizedAnswer;

    // Update question with user input
    const updatedQuestion = {
      ...currentQuestion,
      userInput: userInput.trim(),
      isCorrect: correct
    };
    setCurrentQuestion(updatedQuestion);

    if (correct) {
      // Show success feedback
      showFeedbackMessage({ type: 'success', text: 'Great job!!!' });

      // set user input to correct answer to avoid confusion
      setUserInput(currentQuestion.correctAnswer);

      // Move to next question after delay
      setTimeout(() => {
        moveToNextQuestion();
      }, 2000);
    } else {
      // Show error feedback - keep user's input so they can try again
      showFeedbackMessage({ type: 'error', text: "Wrong choice!!! Don't worry, just try again!" });
    }
  };

  const showFeedbackMessage = (message) => {
    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Set new message
    setFeedbackMessage(message);

    // Set new timeout
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 2000);
  };

  const handleDirectionSelect = (selectedDirection) => {
    setDirection(selectedDirection);
  };

  const moveToNextQuestion = () => {
    const currentIndex = exercise.questions.findIndex(q => q.id === currentQuestion.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < exercise.questions.length) {
      setCurrentQuestion(exercise.questions[nextIndex]);
      setUserInput('');
      setIsInputFocused(false);
    } else {
      // Exercise completed
      setExercise({
        ...exercise,
        isCompleted: true
      });
    }
  };

  const handleRestart = () => {
    setDirection(null);
    setExercise(null);
    setCurrentQuestion(null);
    setFeedbackMessage(null);
    setUserInput('');
    setIsInputFocused(false);
  };

  // Render direction selection screen
  if (!direction) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Translation Direction</Text>
        <Text style={styles.subtitle}>Choose which way you want to practice</Text>
        
        <View style={styles.directionOptions}>
          <TouchableOpacity
            style={styles.directionButton}
            onPress={() => handleDirectionSelect('native-to-studied')}
          >
            <Text style={styles.directionButtonText}>English → Spanish</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.directionButton}
            onPress={() => handleDirectionSelect('studied-to-native')}
          >
            <Text style={styles.directionButtonText}>Spanish → English</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.instructions}>
            Select the direction for translation practice
          </Text>
        </View>
      </View>
    );
  }

  // Render exercise completion screen
  if (exercise && exercise.isCompleted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Exercise Completed!</Text>
        <Text style={styles.subtitle}>Great job!</Text>
        
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Well done!!! You completed all questions!</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestart}
          >
            <Text style={styles.restartButtonText}>Practice Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render exercise screen
  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              {
                width: `${((exercise.questions.findIndex(q => q.id === currentQuestion.id) + 1) / exercise.total) * 100}%`
              }
            ]} 
          />
        </View>
        
        {/* Progress text */}
        <Text style={styles.progressText}>
          {exercise.questions.findIndex(q => q.id === currentQuestion.id) + 1} / {exercise.total}
        </Text>
        
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[
                styles.inputField,
                isInputFocused && styles.inputFieldFocused
              ]}
              value={userInput}
              onChangeText={setUserInput}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              autoFocus={false}
              maxLength={currentQuestion.maxLength}
              textAlign="center"
              textAlignVertical="center"
              placeholder="Type your answer here..."
              placeholderTextColor="#999"
              // Keyboard language hints based on translation direction
              keyboardType="default"
              autoCapitalize={direction === 'studied-to-native' ? 'none' : 'words'}
              autoCorrect={false}
            />
            {userInput.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setUserInput('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, !userInput.trim() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!userInput.trim()}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
        
        {/* Feedback - absolutely positioned like other exercises */}
        {feedbackMessage && (
          <View style={[
            styles.feedbackContainer,
            feedbackMessage.type === 'error' && styles.errorFeedback,
            feedbackMessage.type === 'success' && styles.successFeedback,
          ]}>
            <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  directionOptions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  directionButton: {
    backgroundColor: '#4A90E2',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  directionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'ComicSansMS',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'ComicSansMS',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 10,
    fontFamily: 'ComicSansMS',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  inputField: {
    borderWidth: 0,
    paddingVertical: 10,
    paddingRight: 40, // Space for clear button
    fontSize: 18,
    color: '#333',
    fontFamily: 'ComicSansMS',
    minHeight: 50,
    textAlign: 'center',
    width: '100%',
  },
  inputFieldFocused: {
    // No border changes when focused
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    width: '80%',
    alignSelf: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
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
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  restartButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    width: '80%',
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'ComicSansMS',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TypingTranslationExerciseScreen;
