import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

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
}) => {
  const cellRef = useRef(null);
  const cellLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (cellRef.current && !isHeader && registerCellLayout) {
      cellRef.current.measureInWindow((x, y, width, height) => {
        const layout = { x, y, width, height };
        cellLayout.value = layout;
        registerCellLayout(cell.row, cell.col, layout);
      });
    }
  }, [cell, registerCellLayout, isHeader]);
  
  const getCellStyle = () => {
    if (isHeader) {
      return styles.headerCell;
    }

    if (isWrong) {
      return styles.wrongCell;
    }

    if (showAnswer) {
      if (cell.isFilled) {
        return cell.isCorrect ? styles.correctCell : styles.incorrectCell;
      } else {
        return styles.emptyCell;
      }
    }

    if (cell.isFilled) {
      return styles.filledCell;
    }

    return isDragOver ? styles.emptyHoveredCell : styles.emptyCell;
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

    if (showAnswer && !cell.isFilled) {
      return cell.correctValue;
    }

    return cell.currentValue || '';
  };

  const getFlexStyle = () => {
    if (isRowHeader) {
      return [styles.rowHeaderCell, dynamicWidth && { width: dynamicWidth }];
    }
    return styles.flexCell;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isDragOver ? 0.7 : 1,
    transform: [{ scale: isDragOver ? 1.05 : 1 }],
  }));

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
    backgroundColor: '#e7efe9', // Light green
    borderStyle: 'dashed',
  },
  emptyHoveredCell: {
    backgroundColor: '#618e6c', // Darker green
    borderStyle: 'dashed',
  },
  filledCell: {
    backgroundColor: '#9ed69e', // Successfully filled - darker green
  },
  correctCell: {
    backgroundColor: '#9ed69e', // Successfully filled - darker green
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
    width: 80, // Fixed width for first column to ensure consistent table layout
  },
  flexCell: {
    flex: 1,
  },
  wrongCell: {
    backgroundColor: '#ffcdd2', // Light red background
  },
});

export default TableCell;
