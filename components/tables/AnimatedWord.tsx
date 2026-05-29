import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import AnimatedLetter from './AnimatedLetter';
import {
  OPERATION_TYPES,
  type DeleteOperation,
  type InsertOperation,
  type Operation,
  type WordOperationSequence,
} from '../../utils/domain';

interface Letter {
  id: string;
  char: string;
  orderIndex: number;
  animationOrderIndex: number;
}

interface AnimatedWordProps {
  sequence: WordOperationSequence | null;
  operation: Operation | undefined;
  selectedLetters: Set<number>;
  wordDisplayRef: React.RefObject<View | null>;
  onLetterPress: (letter: string, index: number) => void;
}

const createLetter = (
  char: string,
  orderIndex: number,
  animationOrderIndex: number,
  sequence: WordOperationSequence,
  operationIndex = 0
): Letter => ({
  id: `letter-${sequence.colIndex}-${sequence.rowIndex}-${orderIndex}-${operationIndex}`,
  char,
  orderIndex,
  animationOrderIndex,
});

const performDeleteOperation = (
  operation: DeleteOperation,
  letters: Letter[],
  sequence: WordOperationSequence,
  operationIndex: number
): Letter[] => {
  const newLetters = [...letters];
  newLetters.splice(operation.index, operation.length);
  for (let i = 0; i < newLetters.length; i++) {
    newLetters[i].orderIndex = i;
    if (i < operation.index) {
      newLetters[i].animationOrderIndex = operation.index - i;
    }
    if (i >= operation.index && i < operation.index + operation.length) {
      newLetters[i].animationOrderIndex = i - operation.length;
    }
  }
  return newLetters;
};

const performInsertOperation = (
  operation: InsertOperation,
  letters: Letter[],
  sequence: WordOperationSequence,
  operationIndex: number
): Letter[] => {
  const newLetters = [...letters];
  const insertIndex = operation.index;
  const insertWord = operation.text;
  for (let i = 0; i < insertWord.length; i++) {
    newLetters.splice(
      insertIndex + i,
      0,
      createLetter(insertWord[i], insertIndex + i, i + 1, sequence, operationIndex)
    );
  }
  for (let i = 0; i < newLetters.length; i++) {
    newLetters[i].orderIndex = i;
    newLetters[i].animationOrderIndex = i;
  }
  return newLetters;
};

const AnimatedWord = ({
  sequence,
  operation,
  selectedLetters,
  wordDisplayRef,
  onLetterPress,
}: AnimatedWordProps) => {
  const [prevSequence, setPrevSequence] = useState<WordOperationSequence | null>(null);
  const [letters, setLetters] = useState<Letter[]>([]);

  if (!sequence) return null;

  useEffect(
    () => {
      if (prevSequence === null) {
        const initialLetters = sequence.currentWord
          .split('')
          .map((char, index) => createLetter(char, index, index, sequence));
        setLetters(initialLetters);
      } else if (
        prevSequence.currentOperation !== sequence.currentOperation
      ) {
        const prevOperation = prevSequence.operations[prevSequence.currentOperation];
        if (prevOperation.type === 'delete') {
          setLetters(performDeleteOperation(prevOperation, letters, prevSequence, prevSequence.currentOperation));
        } else if (prevOperation.type === 'insert') {
          setLetters(performInsertOperation(prevOperation, letters, prevSequence, prevSequence.currentOperation));
        }
      } else if (prevSequence && !prevSequence.isCompleted && sequence.isCompleted) {
        const completedOperation = sequence.operations[sequence.currentOperation];
        if (completedOperation.type === 'delete') {
          setLetters(performDeleteOperation(completedOperation, letters, prevSequence, prevSequence.currentOperation));
        } else if (completedOperation.type === 'insert') {
          setLetters(performInsertOperation(completedOperation, letters, prevSequence, prevSequence.currentOperation));
        }
      }

      if (
        prevSequence &&
        (prevSequence.colIndex !== sequence.colIndex ||
          prevSequence.rowIndex !== sequence.rowIndex)
      ) {
        setTimeout(() => {
          const newLetters = sequence.currentWord
            .split('')
            .map((char, index) => createLetter(char, index, index, sequence));
          setLetters(newLetters);
        }, prevSequence.targetWord.length * 100 + 300);
      }

      setPrevSequence(sequence);
    },
    [sequence]
  );

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth - 32;
  const wordLength = letters.length;
  const letterSpacing = 58;
  const maxLettersPerRow = Math.floor(containerWidth / letterSpacing);
  const rows = Math.ceil(wordLength / maxLettersPerRow);
  const height = rows * letterSpacing;

  const getLetterPosition = (index: number) => {
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
      <View style={[styles.wordDisplay, { width: '100%', height }]}>
        {letters.map(({ id, char, animationOrderIndex, orderIndex }) => {
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
    height: 58,
  },
});

export default AnimatedWord;
