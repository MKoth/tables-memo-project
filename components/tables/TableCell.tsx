import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { CellData } from '../../utils/domain';
import type { LayoutRect } from '../../types/ui';

interface TableCellProps {
  cell: CellData | null;
  rowLabel?: string;
  colLabel?: string;
  onPress: (cellRef: React.RefObject<View | null>) => void;
  onDrop?: () => void;
  showAnswer: boolean;
  isHeader?: boolean;
  isRowHeader?: boolean;
  dynamicWidth?: number;
  isWrong?: boolean;
  isDragOver?: boolean;
  registerCellLayout?: (row: number, col: number, layout: LayoutRect) => void;
  blinkingCell?: { row: number; col: number } | null;
  blinkAnimation?: SharedValue<number> | null;
}

const TableCell = ({
  cell,
  rowLabel,
  colLabel,
  onPress,
  onDrop,
  showAnswer,
  isHeader = false,
  isRowHeader = false,
  dynamicWidth,
  isWrong = false,
  isDragOver = false,
  registerCellLayout,
  blinkingCell = null,
  blinkAnimation = null,
}: TableCellProps) => {
  const cellRef = useRef<View>(null);
  const cellLayout = useSharedValue<LayoutRect>({ x: 0, y: 0, width: 0, height: 0 });
  const localBlinkAnimation = useSharedValue(1);

  const isBlinkingCell = blinkingCell && cell && cell.row === blinkingCell.row && cell.col === blinkingCell.col;

  useEffect(() => {
    if (cellRef.current && !isHeader && registerCellLayout && cell) {
      cellRef.current.measureInWindow((x, y, width, height) => {
        const layout: LayoutRect = { x, y, width, height };
        cellLayout.value = layout;
        registerCellLayout(cell.row, cell.col, layout);
      });
    }
  }, [cell, registerCellLayout, isHeader]);

  useEffect(() => {
    if (isBlinkingCell) {
      localBlinkAnimation.value = withRepeat(
        withTiming(0.2, { duration: 600 }),
        -1,
        true
      );
    } else {
      localBlinkAnimation.value = 1;
    }
  }, [isBlinkingCell, localBlinkAnimation]);

  const getCellStyle = () => {
    if (isHeader) {
      return styles.headerCell;
    }

    if (isWrong) {
      return styles.wrongCell;
    }

    if (showAnswer) {
      if (cell!.isFilled) {
        return cell!.isCorrect ? styles.correctCell : styles.incorrectCell;
      } else {
        return styles.emptyCell;
      }
    }

    if (cell!.isFilled) {
      return styles.filledCell;
    }

    return isDragOver || isBlinkingCell ? styles.emptyHoveredCell : styles.emptyCell;
  };

  const getTextStyle = () => {
    if (isHeader) {
      return styles.headerText;
    }
    return styles.cellText;
  };

  const displayText = () => {
    if (isHeader) {
      return rowLabel || colLabel;
    }

    if (showAnswer && !cell!.isFilled) {
      return cell!.correctValue;
    }

    return cell!.currentValue || '';
  };

  const getFlexStyle = () => {
    if (isRowHeader) {
      return [styles.rowHeaderCell, dynamicWidth != null ? { width: dynamicWidth } : null];
    }
    return styles.flexCell;
  };

  const animatedStyle = useAnimatedStyle(() => {
    let opacity = isDragOver ? 0.7 : 1;
    let scale = isDragOver ? 1.05 : 1;

    if (isBlinkingCell) {
      opacity = localBlinkAnimation.value;
    }

    const flexStyle = {
      opacity,
      transform: [{ scale }],
    };

    return flexStyle;
  });

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        ref={cellRef}
        style={[styles.cell, getCellStyle(), getFlexStyle()]}
        onPress={() => onPress(cellRef)}
        disabled={isHeader}
      >
        <Text style={getTextStyle()} numberOfLines={1} ellipsizeMode="tail">
          {displayText()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    minWidth: 80,
    minHeight: 40,
    borderRadius: 6,
    margin: 2,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    backgroundColor: '#e7efe9',
    borderStyle: 'dashed',
  },
  emptyHoveredCell: {
    backgroundColor: '#618e6c',
    borderStyle: 'dashed',
  },
  filledCell: {
    backgroundColor: '#9ed69e',
  },
  correctCell: {
    backgroundColor: '#9ed69e',
  },
  incorrectCell: {
    backgroundColor: '#ffebee',
  },
  headerCell: {
    backgroundColor: '#f5f5f5',
  },
  cellText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  headerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontFamily: 'ComicSansMS',
  },
  rowHeaderCell: {
    flex: 0,
    width: 80,
  },
  flexCell: {
    flex: 1,
  },
  wrongCell: {
    backgroundColor: '#ffcdd2',
  },
});

export default TableCell;
