import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'ExerciseSelection'>;

interface Exercise {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: string;
  isImplemented: boolean;
}

const ExerciseSelectionScreen = ({ navigation, route }: Props) => {
  const { selectedLanguage, learningType, selectedTopics } = route.params;

  const getExercisesData = (): Exercise[] => {
    if (learningType === 'tables') {
      return [
        {
          id: 'fill-cells',
          name: 'Fill Cells',
          description: 'Place conjugation variants into the correct table cells',
          icon: '📝',
          difficulty: 'Beginner',
          isImplemented: true,
        },
        {
          id: 'drag-drop',
          name: 'Drag & Drop',
          description: 'Drag variants directly onto table cells',
          icon: '🎯',
          difficulty: 'Intermediate',
          isImplemented: false,
        },
        {
          id: 'transformations',
          name: 'Word Transformations',
          description: 'Transform words according to grammatical rules',
          icon: '🔄',
          difficulty: 'Advanced',
          isImplemented: true,
        },
        {
          id: 'sentence-fitting',
          name: 'Sentence Fitting',
          description: 'Fit conjugated words into sentence contexts',
          icon: '📄',
          difficulty: 'Advanced',
          isImplemented: true,
        },
      ];
    }

    return [
      {
        id: 'multiple-choice',
        name: 'Multiple Choice',
        description: 'Choose the correct translation from options',
        icon: '❓',
        difficulty: 'Beginner',
        isImplemented: true,
      },
      {
        id: 'typing',
        name: 'Typing Practice',
        description: 'Type the correct translation',
        icon: '⌨️',
        difficulty: 'Intermediate',
        isImplemented: true,
      },
      {
        id: 'matching-columns',
        name: 'Matching Columns',
        description: 'Match words between left and right columns',
        icon: '🔗',
        difficulty: 'Intermediate',
        isImplemented: true,
      },
      {
        id: 'sentence-building',
        name: 'Sentence Building',
        description: 'Build sentences using learned vocabulary',
        icon: '📄',
        difficulty: 'Advanced',
        isImplemented: false,
      },
    ];
  };

  const exercises = getExercisesData();

  const handleExerciseSelect = (exercise: Exercise) => {
    if (!exercise.isImplemented) {
      alert(`${exercise.name} exercise is coming soon!`);
      return;
    }

    const routeParams = {
      selectedLanguage,
      learningType,
      selectedTopics,
      exerciseType: exercise.id,
    };

    if (learningType === 'tables' && exercise.id === 'fill-cells') {
      navigation.navigate('FillCellsExercise', routeParams);
    } else if (learningType === 'tables' && exercise.id === 'transformations') {
      navigation.navigate('WordTransformationExercise', routeParams);
    } else if (learningType === 'tables' && exercise.id === 'sentence-fitting') {
      navigation.navigate('SentenceFittingExercise', routeParams);
    } else if (learningType === 'words' && exercise.id === 'multiple-choice') {
      navigation.navigate('MultipleChoiceTranslationExercise', routeParams);
    } else if (learningType === 'words' && exercise.id === 'typing') {
      navigation.navigate('TypingTranslationExercise', routeParams);
    } else if (learningType === 'words' && exercise.id === 'matching-columns') {
      navigation.navigate('MatchingColumnsExercise', routeParams);
    } else {
      alert(`${exercise.name} exercise selected! Implementation coming soon.`);
    }
  };

  const getTitle = () =>
    learningType === 'tables' ? 'Choose Table Exercise' : 'Choose Word Exercise';

  const getSubtitle = () =>
    learningType === 'tables'
      ? 'Select how you want to practice these grammar tables'
      : 'Select how you want to practice these vocabulary topics';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>{getSubtitle()}</Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseCard,
              !exercise.isImplemented && styles.placeholderCard,
            ]}
            onPress={() => handleExerciseSelect(exercise)}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIcon}>
                <Text style={styles.iconText}>{exercise.icon}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDifficulty}>{exercise.difficulty}</Text>
              </View>
              {!exercise.isImplemented && (
                <Text style={styles.comingSoon}>Soon</Text>
              )}
            </View>
            <Text style={styles.exerciseDescription}>{exercise.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Topics</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    paddingHorizontal: 20,
    fontFamily: 'ComicSansMS',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderCard: {
    opacity: 0.7,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  exerciseDifficulty: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'ComicSansMS',
  },
  comingSoon: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: 'bold',
    fontFamily: 'ComicSansMS',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'ComicSansMS',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'ComicSansMS',
  },
});

export default ExerciseSelectionScreen;
