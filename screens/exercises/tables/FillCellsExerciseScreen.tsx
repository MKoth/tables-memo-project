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
import ScrollableTable from '../../../components/tables/ScrollableTable';
import VariantsList from '../../../components/tables/VariantsList';
import { sampleSpanishTable, createFillCellsExercise, type FillCellsExercise } from '../../../utils/domain';
import DragOverlay from '../../../components/tables/DragOverlay';
import type { RootStackScreenProps } from '../../../navigation/types';
import type { FeedbackMessage, LayoutRect } from '../../../types/ui';

type Props = RootStackScreenProps<'FillCellsExercise'>;

const FillCellsExerciseScreen = ({ navigation }: Props) => {
  const [exerciseState, setExerciseState] = useState<FillCellsExercise>(() =>
    createFillCellsExercise(sampleSpanishTable)
  );
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [wrongCell, setWrongCell] = useState<{ row: number; col: number } | null>(null);
  const [animatingVariant, setAnimatingVariant] = useState<string | null>(null);
  const [selectedVariantRef, setSelectedVariantRef] = useState<React.RefObject<View | null> | null>(null);
  const [draggedVariant, setDraggedVariant] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyingVariantPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flyingVariantWidth = useRef(new Animated.Value(80)).current;
  const cellLayouts = useRef(new Map<string, LayoutRect>()).current;

  const showFeedbackMessage = (message: FeedbackMessage) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedbackMessage(message);

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 2000);
  };

  const handleVariantSelect = (variant: string, variantRef: React.RefObject<View | null>) => {
    setExerciseState(prev => ({
      ...prev,
      selectedVariant: prev.selectedVariant === variant ? null : variant,
    }));

    if (variant && variantRef) {
      setSelectedVariantRef(variantRef);
    } else {
      setSelectedVariantRef(null);
    }
  };

  const getGlobalPosition = (ref: React.RefObject<View | null> | null): Promise<LayoutRect | null> => {
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

  const animateVariantToCell = async (
    variantRef: React.RefObject<View | null> | null,
    cellRef: React.RefObject<View | null>
  ): Promise<void> => {
    const startPos = await getGlobalPosition(variantRef);
    const endPos = await getGlobalPosition(cellRef);

    if (!startPos || !endPos) {
      console.warn('Could not measure positions for animation');
      return;
    }

    const headerHeight = 64;

    flyingVariantPosition.setValue({ x: startPos.x, y: startPos.y - headerHeight });
    flyingVariantWidth.setValue(startPos.width);

    return new Promise((resolve) => {
      Animated.parallel([
        Animated.timing(flyingVariantPosition, {
          toValue: { x: endPos.x, y: endPos.y - headerHeight },
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(flyingVariantWidth, {
          toValue: endPos.width,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        resolve();
      });
    });
  };

  const handleCellPress = async (row: number, col: number, cellRef: React.RefObject<View | null>) => {
    if (!exerciseState.selectedVariant) {
      Alert.alert('Select a variant first', 'Please select a variant from the list below before placing it in a cell.');
      return;
    }

    const targetCell = exerciseState.table.cells[row][col];
    const isCorrect = targetCell.correctValue === exerciseState.selectedVariant;

    if (isCorrect) {
      setAnimatingVariant(exerciseState.selectedVariant);

      try {
        await animateVariantToCell(selectedVariantRef, cellRef);

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

          const newVariants = prev.variants.filter(v => v !== prev.selectedVariant);

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

        showFeedbackMessage({ type: 'success', text: 'Great job!!!' });

        const isCompleted = exerciseState.table.cells.flat().every(cell =>
          cell.isFilled || (row === cell.row && col === cell.col)
        );

        if (isCompleted) {
          showFeedbackMessage({ type: 'completion', text: 'Well done!!! You completed all cells!' });
        }

      } finally {
        setAnimatingVariant(null);
        setSelectedVariantRef(null);
        flyingVariantWidth.setValue(80);
      }

    } else {
      setWrongCell({ row, col });
      showFeedbackMessage({ type: 'error', text: "Wrong choice!!! Don't worry, just try again!" });

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

  const getUsedVariants = (): string[] => {
    return exerciseState.table.cells
      .flat()
      .filter(cell => cell.isFilled)
      .map(cell => cell.currentValue)
      .filter((value): value is string => value != null);
  };

  const handleVariantDragStart = (variant: string) => {
    setDraggedVariant(variant);
    setExerciseState(prev => ({
      ...prev,
      selectedVariant: variant,
    }));
  };

  const handleVariantDragUpdate = (x: number, y: number, _variant: string) => {
    setDragPosition({ x, y });

    let foundHoveredCell: { row: number; col: number } | null = null;
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

  const handleVariantDragEnd = async (variant: string) => {
    if (hoveredCell && !exerciseState.table.cells[hoveredCell.row][hoveredCell.col].isFilled) {
      await handleCellDrop(hoveredCell.row, hoveredCell.col, variant);
    }

    setDraggedVariant(null);
    setDragPosition({ x: 0, y: 0 });
    setHoveredCell(null);
  };

  const handleCellDrop = async (row: number, col: number, variant: string) => {
    const targetCell = exerciseState.table.cells[row][col];
    const isCorrect = targetCell.correctValue === variant;

    if (isCorrect) {
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

        const newVariants = prev.variants.filter(v => v !== variant);

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

      showFeedbackMessage({ type: 'success', text: 'Great job!!!' });

      if (exerciseState.table.cells.flat().every(cell => cell.isFilled)) {
        showFeedbackMessage({ type: 'completion', text: 'Well done!!! You completed all cells!' });
      }
    } else {
      setWrongCell({ row, col });
      showFeedbackMessage({ type: 'error', text: "Wrong choice!!! Don't worry, just try again!" });

      setTimeout(() => {
        setWrongCell(null);
      }, 2000);
    }
  };

  const registerCellLayout = (row: number, col: number, layout: LayoutRect) => {
    cellLayouts.set(`${row}-${col}`, layout);
  };

  const getCellIsHovered = (row: number, col: number): boolean => {
    return !!(hoveredCell && hoveredCell.row === row && hoveredCell.col === col);
  };

  return (
    <View style={styles.container}>
      {animatingVariant && selectedVariantRef && (
        <Animated.View
          style={[
            styles.flyingVariant,
            {
              left: 0,
              top: 0,
              width: flyingVariantWidth,
              transform: flyingVariantPosition.getTranslateTransform(),
            },
          ]}
        >
          <Text style={styles.flyingVariantText}>{animatingVariant}</Text>
        </Animated.View>
      )}

      {(feedbackMessage) && (
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
            {feedbackMessage.text}
          </Text>
        </View>
      )}

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

      <DragOverlay
        draggedVariant={draggedVariant}
        dragPosition={{ x: dragPosition.x - 35, y: dragPosition.y - 18 }}
        isDragging={!!draggedVariant}
      />

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
    fontFamily: 'ComicSansMS',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'ComicSansMS',
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
    fontFamily: 'ComicSansMS',
  },
  secondaryButtonText: {
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  variantsContainer: {
    flex: 1,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 10,
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
    backgroundColor: '#ffebee',
  },
  successFeedback: {
    backgroundColor: '#e8f5e8',
  },
  completionFeedback: {
    backgroundColor: '#e8f5e8',
  },
  dragFeedback: {
    backgroundColor: '#e6e6fa',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  dragFeedbackText: {
    color: '#a089d1',
  },
  flyingVariant: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#a089d1',
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
    color: '#333',
    fontWeight: 'normal',
    fontFamily: 'ComicSansMS',
  },
});

export default FillCellsExerciseScreen;
