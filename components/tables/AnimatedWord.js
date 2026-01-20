import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import AnimatedLetter from './AnimatedLetter';
import { OPERATION_TYPES } from '../../utils/types';

const createLetter = (char, orderIndex, animationOrderIndex, sequence, operationIndex = 0) => ({
  id: `letter-${sequence.colIndex}-${sequence.rowIndex}-${orderIndex}-${operationIndex}`, char, orderIndex, animationOrderIndex
});

// Helper function to perform delete operation animation
const performDeleteOperation = (operation, letters, sequence, operationIndex) => {
  const newLetters = [...letters];
  newLetters.splice(operation.index, operation.length);
  // after deletion, update orderIndex of remaining letters
  for (let i = 0; i < newLetters.length; i++) {
      newLetters[i].orderIndex = i;
      // update animationOrderIndex to reflect deletion order
      if (i < operation.index) {
          newLetters[i].animationOrderIndex = operation.index - i;
      }
      if (i >= operation.index && i < operation.index + operation.length) {
          newLetters[i].animationOrderIndex = i - operation.length;
      }
  }
  return newLetters;
};

// Helper function to perform insert operation animation
const performInsertOperation = (operation, letters, sequence, operationIndex) => {
  const newLetters = [...letters];
  const insertIndex = operation.index;
  const insertWord = operation.text;
  for (let i = 0; i < insertWord.length; i++) {
      newLetters.splice(insertIndex + i, 0, createLetter(insertWord[i], insertIndex + i, i + 1, sequence, operationIndex));
  }
  // after insertion, update orderIndex of all letters
  for (let i = 0; i < newLetters.length; i++) {
      newLetters[i].orderIndex = i;
      newLetters[i].animationOrderIndex = i;
  }
  return newLetters;
};

const AnimatedWord = ({ sequence, operation, selectedLetters, wordDisplayRef, onLetterPress }) => {
  if (!sequence) return null;

  const [prevSequence, setPrevSequence] = useState(null);
  const [letters, setLetters] = useState([]);

  useEffect(
    () => {
        if (prevSequence === null) {
            const initialLetters = sequence.currentWord.split('').map((char, index) => createLetter(char, index, index, sequence));
            setLetters(initialLetters);
        } else if (
            prevSequence.currentOperation !== sequence.currentOperation
        ) {
            const operation = prevSequence.operations[prevSequence.currentOperation];
            if (operation.type === "delete") {
                setLetters(performDeleteOperation(operation, letters, prevSequence, prevSequence.currentOperation));
            } else if (operation.type === "insert") {
                setLetters(performInsertOperation(operation, letters, prevSequence, prevSequence.currentOperation));
            }

        } else if (prevSequence && !prevSequence.isCompleted && sequence.isCompleted) {
            // Last operation animation when sequence just completed
            const operation = sequence.operations[sequence.currentOperation];
            if (operation.type === "delete") {
                setLetters(performDeleteOperation(operation, letters, prevSequence, prevSequence.currentOperation));
            } else if (operation.type === "insert") {
                setLetters(performInsertOperation(operation, letters, prevSequence, prevSequence.currentOperation));
            }
        }

        if (
            prevSequence &&
            (prevSequence.colIndex !== sequence.colIndex ||
            prevSequence.rowIndex !== sequence.rowIndex)
        ) {
            setTimeout(() => {
                const newLetters = sequence.currentWord.split('').map((char, index) => createLetter(char, index, index, sequence));
                setLetters(newLetters);
            }, prevSequence.targetWord.length * 100 + 300); // wait for previous animations to finish
        }

        setPrevSequence(sequence);
    }, [sequence]
  )

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth - 32; // minus padding
  const wordLength = letters.length;
  const letterSpacing = 58;
  const maxLettersPerRow = Math.floor(containerWidth / letterSpacing);
  const rows = Math.ceil(wordLength / maxLettersPerRow);
  const height = rows * letterSpacing;

  const getLetterPosition = (index) => {
    const row = Math.floor(index / maxLettersPerRow);
    const col = index % maxLettersPerRow;
    const lettersInRow = Math.min(maxLettersPerRow, wordLength - row * maxLettersPerRow);
    const rowWidth = lettersInRow * letterSpacing;
    const startX = (containerWidth - rowWidth) / 2;
    const left = startX + col * letterSpacing;
    const top = row * letterSpacing;
    return { left, top };
  };

  return (
    <View ref={wordDisplayRef} style={styles.wordContainer}>
      <Text style={styles.wordLabel}>Current Word:</Text>
      <View style={[styles.wordDisplay, { width: "100%", height }]}>
        {letters.map(({id, char, animationOrderIndex, orderIndex}) => {
          const { left, top } = getLetterPosition(orderIndex);
          return (
            <AnimatedLetter
              key={id}
              letter={char}
              index={orderIndex}
              selected={selectedLetters.has(orderIndex)}
              disabled={operation?.type !== OPERATION_TYPES.DELETE}
              onPress={onLetterPress}
              animationOrderIndex={animationOrderIndex}
              totalLetters={wordLength}
              mode={prevSequence === null ? 'entering' : 'idle'}
              position={{ left, top }}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'ComicSansMS',
  },
  wordDisplay: {
    position: 'relative',
    height: 58, // 50px height + margins
  },
});

export default AnimatedWord;
