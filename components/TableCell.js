import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TableCell = ({
  cell,
  rowLabel,
  colLabel,
  onPress,
  showAnswer,
  isHeader = false,
  isRowHeader = false,
  dynamicWidth,
  isWrong = false,
}) => {
  const cellRef = useRef(null);
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

    return styles.emptyCell;
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

  return (
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
  );
};

const styles = StyleSheet.create({
  cell: {
    minWidth: 100,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    margin: 4,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    backgroundColor: '#f9f9f9',
    borderStyle: 'dashed',
  },
  filledCell: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  correctCell: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  incorrectCell: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  headerCell: {
    backgroundColor: '#f5f5f5',
    borderColor: '#bbb',
  },
  cellText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  headerText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
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
    borderColor: '#d32f2f', // Dark red border
    borderWidth: 2, // Thicker border for emphasis
  },
});

export default TableCell;
