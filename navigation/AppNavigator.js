import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import LanguageSelectionScreen from '../screens/selection/LanguageSelectionScreen';
import LearningTypeSelectionScreen from '../screens/selection/LearningTypeSelectionScreen';
import TopicSelectionScreen from '../screens/selection/TopicSelectionScreen';
import ExerciseSelectionScreen from '../screens/selection/ExerciseSelectionScreen';
import FillCellsExerciseScreen from '../screens/exercises/tables/FillCellsExerciseScreen';
import WordTransformationExerciseScreen from '../screens/exercises/tables/WordTransformationExerciseScreen';
import SentenceFittingExerciseScreen from '../screens/exercises/tables/SentenceFittingExerciseScreen';
import MultipleChoiceTranslationExerciseScreen from '../screens/exercises/words/MultipleChoiceTranslationExerciseScreen';
import TypingTranslationExerciseScreen from '../screens/exercises/words/TypingTranslationExerciseScreen';
import MatchingColumnsExerciseScreen from '../screens/exercises/words/MatchingColumnsExerciseScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
          options={{ title: 'Select Language' }}
        />
        <Stack.Screen
          name="LearningTypeSelection"
          component={LearningTypeSelectionScreen}
          options={{ title: 'Choose Learning Type' }}
        />
        <Stack.Screen
          name="TopicSelection"
          component={TopicSelectionScreen}
          options={{ title: 'Select Topics' }}
        />
        <Stack.Screen
          name="ExerciseSelection"
          component={ExerciseSelectionScreen}
          options={{ title: 'Choose Exercise' }}
        />
        <Stack.Screen
          name="FillCellsExercise"
          component={FillCellsExerciseScreen}
          options={{ title: 'Fill Cells Exercise' }}
        />
        <Stack.Screen
          name="WordTransformationExercise"
          component={WordTransformationExerciseScreen}
          options={{ title: 'Word Transformations' }}
        />
        <Stack.Screen
          name="SentenceFittingExercise"
          component={SentenceFittingExerciseScreen}
          options={{ title: 'Sentence Fitting' }}
        />
        <Stack.Screen
          name="MultipleChoiceTranslationExercise"
          component={MultipleChoiceTranslationExerciseScreen}
          options={{ title: 'Multiple Choice Translation' }}
        />
        <Stack.Screen
          name="TypingTranslationExercise"
          component={TypingTranslationExerciseScreen}
          options={{ title: 'Typing Translation' }}
        />
        <Stack.Screen
          name="MatchingColumnsExercise"
          component={MatchingColumnsExerciseScreen}
          options={{ title: 'Matching Columns' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
