import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import ScrollableTable from './ScrollableTable';
import VariantsList from './VariantsList';
import { sampleSpanishTable, createFillCellsExercise } from '../utils/types';

const TableExerciseScreen = ({ navigation }) => {
  const [exerciseState, setExerciseState] = useState(() =>
    createFillCellsExercise(sampleSpanishTable)
  );
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [wrongCell, setWrongCell] = useState(null);
  const [animatingVariant, setAnimatingVariant] = useState(null);
  const [selectedVariantRef, setSelectedVariantRef] = useState(null);
  const feedbackTimeoutRef = useRef(null);
  const flyingVariantPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingVariantWidth = useRef(new Animated.Value(80)).current; // Default width

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

  const handleVariantSelect = (variant, variantRef) => {
    setExerciseState(prev => ({
      ...prev,
      selectedVariant: prev.selectedVariant === variant ? null : variant,
    }));

    // Capture the ref of the selected variant for animation
    if (variant && variantRef) {
      setSelectedVariantRef(variantRef);
    } else {
      setSelectedVariantRef(null);
    }
  };

  const getGlobalPosition = (ref) => {
    return new Promise((resolve) => {
      if (ref?.current) {
        ref.current.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    });
  };

  const animateVariantToCell = async (variantRef, cellRef) => {
    // Get positions at the moment of animation
    const startPos = await getGlobalPosition(variantRef);
    const endPos = await getGlobalPosition(cellRef);

    if (!startPos || !endPos) {
      console.warn('Could not measure positions for animation');
      return;
    }

    const headerHeight = 64;

    // Set initial position and width
    flyingVariantPosition.setValue({ x: startPos.x, y: startPos.y - headerHeight });
    flyingVariantWidth.setValue(startPos.width);

    return new Promise((resolve) => {
      Animated.parallel([
        Animated.timing(flyingVariantPosition, {
          toValue: { x: endPos.x, y: endPos.y - headerHeight },
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flyingVariantWidth, {
          toValue: endPos.width,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true, // Width animation needs native driver false
        }),
      ]).start(() => {
        resolve();
      });
    });
  };



  const handleCellPress = async (row, col, cellRef) => {
    if (!exerciseState.selectedVariant) {
      Alert.alert('Select a variant first', 'Please select a variant from the list below before placing it in a cell.');
      return;
    }

    const targetCell = exerciseState.table.cells[row][col];
    const isCorrect = targetCell.correctValue === exerciseState.selectedVariant;

    if (isCorrect) {
      // Start animation with the selected variant
      setAnimatingVariant(exerciseState.selectedVariant);

      try {
        // Phase 1: Animate variant flying from selected variant to cell
        await animateVariantToCell(selectedVariantRef, cellRef);

        // Phase 2: Fill cell and remove variant
        setExerciseState(prev => {
          const newCells = prev.table.cells.map((cellRow, rowIndex) =>
            cellRow.map((cell, colIndex) => {
              if (rowIndex === row && colIndex === col) {
                return {
                  ...cell,
                  currentValue: prev.selectedVariant,
                  isFilled: true,
                  isCorrect: true,
                };
              }
              return cell;
            })
          );

          // Remove used variant from variants list
          const newVariants = prev.variants.filter(v => v !== prev.selectedVariant);

          // Check if exercise is completed
          const isCompleted = newCells.flat().every(cell => cell.isFilled);

          return {
            ...prev,
            table: {
              ...prev.table,
              cells: newCells,
            },
            variants: newVariants,
            selectedVariant: null,
            isCompleted,
          };
        });

        // Show success feedback
        showFeedbackMessage({ type: 'success', text: 'Great job!!!' });

        // Check completion
        const isCompleted = exerciseState.table.cells.flat().every(cell =>
          cell.isFilled || (row === cell.row && col === cell.col)
        );

        if (isCompleted) {
          showFeedbackMessage({ type: 'completion', text: 'Well done!!! You completed all cells!' });
        }

      } finally {
        // Clean up animation state
        setAnimatingVariant(null);
        setSelectedVariantRef(null);
        flyingVariantPosition.setValue({ x: 0, y: 0 });
        flyingVariantWidth.setValue(80); // Reset to default width
      }

    } else {
      // Wrong choice - show red cell temporarily
      setWrongCell({ row, col });
      showFeedbackMessage({ type: 'error', text: "Wrong choice!!! Don't worry, just try again!" });

      // Clear wrong cell after 2 seconds (separate from message timeout)
      setTimeout(() => {
        setWrongCell(null);
      }, 2000);
    }
  };



  const handleReset = () => {
    Alert.alert(
      'Reset Exercise',
      'Are you sure you want to reset the exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setExerciseState(createFillCellsExercise(sampleSpanishTable));
          },
        },
      ]
    );
  };

  const getUsedVariants = () => {
    return exerciseState.table.cells
      .flat()
      .filter(cell => cell.isFilled)
      .map(cell => cell.currentValue);
  };

  return (
    <View style={styles.container}>
      {/* Flying Variant Animation Overlay */}
      {animatingVariant && selectedVariantRef && (
        <Animated.View
          style={[
            styles.flyingVariant,
            {
              left: 0, // Will be positioned by transform
              top: 0,
              width: flyingVariantWidth,
              transform: flyingVariantPosition.getTranslateTransform(),
            },
          ]}
        >
          <Text style={styles.flyingVariantText}>{animatingVariant}</Text>
        </Animated.View>
      )}

      {/* Feedback Message - absolutely positioned to overlay table */}
      {feedbackMessage && (
        <View style={[
          styles.feedbackContainer,
          feedbackMessage.type === 'error' && styles.errorFeedback,
          feedbackMessage.type === 'success' && styles.successFeedback,
          feedbackMessage.type === 'completion' && styles.completionFeedback,
        ]}>
          <Text style={styles.feedbackText}>
            {feedbackMessage.text}
          </Text>
        </View>
      )}
      {/* Header - fixed at top */}
      <View style={styles.header}>
        <Text style={styles.title}>{exerciseState.table.name}</Text>
        <Text style={styles.subtitle}>
          Fill the table with the correct conjugations
        </Text>
      </View>

      {/* Content area - takes remaining space above buttons */}
      <View style={styles.contentContainer}>
        {/* Table - takes remaining space in content area */}
        <View style={styles.tableContainer}>
          <ScrollableTable
            table={exerciseState.table}
            onCellPress={handleCellPress}
            showAnswers={exerciseState.showAnswers}
            wrongCell={wrongCell}
          />
        </View>

      {/* Variants List - constrained height within content area */}
      {!exerciseState.isCompleted && (
        <View style={styles.variantsContainer}>
          <VariantsList
            variants={exerciseState.variants}
            selectedVariant={exerciseState.selectedVariant}
            onVariantSelect={handleVariantSelect}
            usedVariants={getUsedVariants()}
          />
        </View>
      )}
      </View>

      {/* Action Buttons - absolutely positioned at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReset}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Reset
          </Text>
        </TouchableOpacity>



        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Back
          </Text>
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
  scrollContainer: {
    flex: 1,
    minHeight: 400,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  progress: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
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
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 16,
    minHeight: 200,
  },
  variantsContainer: {
    maxHeight: '50vh',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 10, // Position near table header area
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
    backgroundColor: '#ffebee', // Rosy background for errors
  },
  successFeedback: {
    backgroundColor: '#e8f5e8', // Greenish background for success
  },
  completionFeedback: {
    backgroundColor: '#e8f5e8', // Greenish background for completion
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  flyingVariant: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e8f5e8', // Light green to match successful cells
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50', // Green border to match successful cells
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 2000,
  },
  flyingVariantText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333', // Dark text to match successful cell text
    fontWeight: 'normal',
  },
});

export default TableExerciseScreen;
