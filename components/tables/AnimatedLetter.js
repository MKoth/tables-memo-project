import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

const AnimatedLetter = ({ letter, index, selected, disabled, onPress, animationOrderIndex = 0, totalLetters = 1, mode = 'idle', position = { left: 0, top: 0 } }) => {
  const getEnteringAnimation = () => {
    return FadeIn.delay(animationOrderIndex * 100).springify();
  };

  const getExitingAnimation = () => {
    const reverseIndex = (totalLetters - 1) - animationOrderIndex;
    return FadeOut.delay(reverseIndex * 100).springify();
  }

  return (
    <Animated.View
      entering={getEnteringAnimation()}
      exiting={getExitingAnimation()}
      layout={LinearTransition.springify().delay(animationOrderIndex * 100)}
      style={{ position: 'absolute', left: position.left, top: position.top }}
    >
      <TouchableOpacity
        style={[
          styles.letterButton,
          selected && styles.selectedLetter,
          disabled && styles.disabledLetter
        ]}
        onPress={() => onPress(letter, index)}
        disabled={disabled}
      >
        <Text style={[
          styles.letterText,
          selected && styles.selectedLetterText
        ]}>
          {letter}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  letterButton: {
    width: 50,
    height: 50,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#e6e6fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLetter: {
    backgroundColor: '#a089d1',
    borderColor: '#8a6bbf',
  },
  disabledLetter: {
    opacity: 0.6,
  },
  letterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  selectedLetterText: {
    color: '#fff',
  },
});

export default AnimatedLetter;
