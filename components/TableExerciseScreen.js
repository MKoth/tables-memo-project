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
import { useSharedValue } from 'react-native-reanimated';
import DragOverlay from './DragOverlay';

const TableExerciseScreen = ({ navigation }) => {
  const [exerciseState, setExerciseState] = useState(() =>
    createFillCellsExercise(sampleSpanishTable)
  );
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [wrongCell, setWrongCell] = useState(null);
  const [animatingVariant, setAnimatingVariant] = useState(null);
  const [selectedVariantRef, setSelectedVariantRef] = useState(null);
  const [draggedVariant, setDraggedVariant] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const feedbackTimeoutRef = useRef(null);
  const flyingVariantPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingVariantWidth = useRef(new Animated.Value(80)).current; // Default width
  const cellLayouts = useRef(new Map()).current; // Store cell positions for hit testing

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

  // Drag and drop handlers
  const handleVariantDragStart = (variant) => {
    setDraggedVariant(variant);
    // Select the dragged variant and deselect any previously selected variant
    setExerciseState(prev => ({
      ...prev,
      selectedVariant: variant,
    }));
  };

  const handleVariantDragUpdate = (x, y, variant) => {
    setDragPosition({ x, y });

    // Hit test against cells
    let foundHoveredCell = null;
    for (const [cellKey, layout] of cellLayouts.entries()) {
      if (
        x >= layout.x &&
        x <= layout.x + layout.width &&
        y >= layout.y &&
        y <= layout.y + layout.height
      ) {
        const [row, col] = cellKey.split('-').map(Number);
        foundHoveredCell = { row, col };
        break;
      }
    }
    setHoveredCell(foundHoveredCell);
  };

  const handleVariantDragEnd = async (variant) => {
    if (hoveredCell && !exerciseState.table.cells[hoveredCell.row][hoveredCell.col].isFilled) {
      // Drop on cell
      await handleCellDrop(hoveredCell.row, hoveredCell.col, variant);
    }

    // Clean up drag state
    setDraggedVariant(null);
    setDragPosition({ x: 0, y: 0 });
    setHoveredCell(null);
  };

  const handleCellDrop = async (row, col, variant) => {
    const targetCell = exerciseState.table.cells[row][col];
    const isCorrect = targetCell.correctValue === variant;

    if (isCorrect) {
      // Fill cell and remove variant
      setExerciseState(prev => {
        const newCells = prev.table.cells.map((cellRow, rowIndex) =>
          cellRow.map((cell, colIndex) => {
            if (rowIndex === row && colIndex === col) {
              return {
                ...cell,
                currentValue: variant,
                isFilled: true,
                isCorrect: true,
              };
            }
            return cell;
          })
        );

        // Remove used variant from variants list
        const newVariants = prev.variants.filter(v => v !== variant);

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
      if (exerciseState.table.cells.flat().every(cell => cell.isFilled)) {
        showFeedbackMessage({ type: 'completion', text: 'Well done!!! You completed all cells!' });
      }
    } else {
      // Wrong choice - show red cell temporarily
      setWrongCell({ row, col });
      showFeedbackMessage({ type: 'error', text: "Wrong choice!!! Don't worry, just try again!" });

      // Clear wrong cell after 2 seconds
      setTimeout(() => {
        setWrongCell(null);
      }, 2000);
    }
  };

  const registerCellLayout = (row, col, layout) => {
    cellLayouts.set(`${row}-${col}`, layout);
  };

  const getCellIsHovered = (row, col) => {
    return hoveredCell && hoveredCell.row === row && hoveredCell.col === col;
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
      {(feedbackMessage || draggedVariant) && (
        <View style={[
          styles.feedbackContainer,
          draggedVariant ? styles.dragFeedback : (
            feedbackMessage.type === 'error' && styles.errorFeedback ||
            feedbackMessage.type === 'success' && styles.successFeedback ||
            feedbackMessage.type === 'completion' && styles.completionFeedback
          ),
        ]}>
          <Text style={[
            styles.feedbackText,
            draggedVariant && styles.dragFeedbackText,
          ]}>
            {draggedVariant ? `Dragging: ${draggedVariant}` : feedbackMessage.text}
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
            getCellIsHovered={getCellIsHovered}
            registerCellLayout={registerCellLayout}
            draggedVariant={draggedVariant}
            dragPosition={dragPosition}
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
            onVariantDragStart={handleVariantDragStart}
            onVariantDragEnd={handleVariantDragEnd}
            onVariantDragUpdate={handleVariantDragUpdate}
            draggedVariant={draggedVariant}
          />
        </View>
      )}
      </View>

      {/* Drag Overlay - renders dragged variant at global level */}
      <DragOverlay
        draggedVariant={draggedVariant}
        dragPosition={dragPosition}
        isDragging={!!draggedVariant}
      />

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
    padding: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'Comic Sans MS',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Comic Sans MS',
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
    padding: 12,
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Comic Sans MS',
  },
  secondaryButtonText: {
    color: '#666',
    fontFamily: 'Comic Sans MS',
  },
  contentContainer: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 10,
    minHeight: 150,
  },
  variantsContainer: {
    maxHeight: '30vh',
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
  dragFeedback: {
    backgroundColor: '#e6e6fa', // Light purple background for drag feedback
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    fontFamily: 'Comic Sans MS',
  },
  dragFeedbackText: {
    color: '#a089d1', // Purple text to match selected variants
  },
  flyingVariant: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#a089d1', // Match selected variant purple
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 2000,
    width: 80,
    height: 40,
    justifyContent: 'center',
  },
  flyingVariantText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333', // Dark text to match successful cell text
    fontWeight: 'normal',
    fontFamily: 'Comic Sans MS',
  },
});

export default TableExerciseScreen;
