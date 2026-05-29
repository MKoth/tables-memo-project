import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { RootStackScreenProps } from '../../../navigation/types';
import type { FeedbackMessage } from '../../../types/ui';
import {
  getWordsForTopics,
  createMultipleChoiceExercise,
  type MultipleChoiceExercise,
  type MultipleChoiceQuestion,
  type TranslationDirection,
} from '../../../utils/domain';

type Props = RootStackScreenProps<'MultipleChoiceTranslationExercise'>;

type CurrentMultipleChoiceQuestion = MultipleChoiceQuestion & {
  selectedChoice?: string;
};

const MultipleChoiceTranslationExerciseScreen = ({ route }: Props) => {
  const { selectedTopics } = route.params || {};

  const [direction, setDirection] = useState<TranslationDirection | null>(null);
  const [exercise, setExercise] = useState<MultipleChoiceExercise | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentMultipleChoiceQuestion | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [score, setScore] = useState(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (direction && !exercise) {
      const words = getWordsForTopics(selectedTopics ?? []);
      const newExercise = createMultipleChoiceExercise(words, direction);
      setExercise(newExercise);
      setCurrentQuestion(newExercise.questions[0]);
    }
  }, [direction, exercise, selectedTopics]);

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

  const handleDirectionSelect = (selectedDirection: TranslationDirection) => {
    setDirection(selectedDirection);
  };

  const moveToNextQuestion = () => {
    if (!exercise || !currentQuestion) return;

    const currentIndex = exercise.questions.findIndex((q) => q.id === currentQuestion.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < exercise.questions.length) {
      setCurrentQuestion(exercise.questions[nextIndex]);
    } else {
      setExercise({
        ...exercise,
        isCompleted: true,
      });
    }
  };

  const handleAnswerSelect = (selectedChoice: string) => {
    if (!currentQuestion) return;

    const correct = selectedChoice === currentQuestion.correctAnswer;

    const updatedQuestion: CurrentMultipleChoiceQuestion = {
      ...currentQuestion,
      selectedChoice: selectedChoice,
    };
    setCurrentQuestion(updatedQuestion);

    if (correct) {
      showFeedbackMessage({ type: 'success', text: 'Great job!!!' });

      setTimeout(() => {
        moveToNextQuestion();
      }, 2000);
    } else {
      showFeedbackMessage({ type: 'error', text: "Wrong choice!!! Don't worry, just try again!" });
    }
  };

  const handleRestart = () => {
    setDirection(null);
    setExercise(null);
    setCurrentQuestion(null);
    setFeedbackMessage(null);
    setScore(0);
  };

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

  if (!currentQuestion || !exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((exercise.questions.findIndex((q) => q.id === currentQuestion.id) + 1) / exercise.total) * 100}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.progressText}>
        {exercise.questions.findIndex((q) => q.id === currentQuestion.id) + 1} / {exercise.total}
      </Text>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      <ScrollView style={styles.choicesContainer}>
        {currentQuestion.choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.choiceButton,
              currentQuestion.selectedChoice === choice && currentQuestion.selectedChoice === currentQuestion.correctAnswer && styles.correctChoice,
              currentQuestion.selectedChoice === choice && currentQuestion.selectedChoice !== currentQuestion.correctAnswer && styles.incorrectChoice,
            ]}
            onPress={() => handleAnswerSelect(choice)}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  choicesContainer: {
    flex: 1,
  },
  choiceButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  choiceText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  correctChoice: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  incorrectChoice: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 2,
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

export default MultipleChoiceTranslationExerciseScreen;
