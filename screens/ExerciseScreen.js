import React from 'react';
import TableExerciseScreen from '../components/TableExerciseScreen';

const ExerciseScreen = ({ navigation, route }) => {
  // For now, always show the fill-cells exercise
  // Later this can be expanded to handle different exercise types
  return <TableExerciseScreen navigation={navigation} route={route} />;
};

export default ExerciseScreen;
