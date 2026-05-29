import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface Language {
  id: string;
  name: string;
  flag: string;
}

export type LearningType = 'tables' | 'words';

export type ExerciseRouteParams = {
  selectedLanguage?: Language | null;
  learningType?: LearningType;
  selectedTopics?: string[];
  exerciseType?: string;
};

export type RootStackParamList = {
  Login: undefined;
  LanguageSelection: undefined;
  LearningTypeSelection: { selectedLanguage: Language | null };
  TopicSelection: {
    selectedLanguage?: Language | null;
    learningType: LearningType;
  };
  ExerciseSelection: {
    selectedLanguage?: Language | null;
    learningType: LearningType;
    selectedTopics: string[];
  };
  FillCellsExercise: ExerciseRouteParams;
  WordTransformationExercise: ExerciseRouteParams;
  SentenceFittingExercise: ExerciseRouteParams;
  MultipleChoiceTranslationExercise: ExerciseRouteParams;
  TypingTranslationExercise: ExerciseRouteParams;
  MatchingColumnsExercise: ExerciseRouteParams;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
