import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import TableSelectionScreen from '../screens/TableSelectionScreen';
import WordSelectionScreen from '../screens/WordSelectionScreen';
import ExerciseScreen from '../screens/ExerciseScreen';

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
          name="TableSelection"
          component={TableSelectionScreen}
          options={{ title: 'Select Tables' }}
        />
        <Stack.Screen
          name="WordSelection"
          component={WordSelectionScreen}
          options={{ title: 'Select Words' }}
        />
        <Stack.Screen
          name="Exercise"
          component={ExerciseScreen}
          options={{ title: 'Exercise' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
