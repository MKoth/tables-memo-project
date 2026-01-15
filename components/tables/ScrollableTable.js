import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import TableCell from './TableCell';
import ScrollHandles from './ScrollHandles';

const CELL_WIDTH = 80;
const CELL_HEIGHT = 40;

const ScrollableTable = ({
  table,
  onCellPress,
  showAnswers = false,
  wrongCell = null,
  getCellIsHovered,
  registerCellLayout,
  draggedVariant,
  dragPosition,
  blinkingCell = null,
  blinkAnimation = null,
}) => {
  const scrollSpeed = 10;
  const [firstColumnWidth, setFirstColumnWidth] = useState(80);
  const [tableHeight, setTableHeight] = useState(300);
  const [viewportSize, setViewportSize] = useState({ width: 400, height: 300 }); // Default fallback
  const [scrollState, setScrollState] = useState({
    horizontal: { offset: 0, maxOffset: 0, canScrollLeft: false, canScrollRight: false },
    vertical: { offset: 0, maxOffset: 0, canScrollUp: false, canScrollDown: false },
  });
  const [mainTableBodyLayout, setMainTableBodyLayout] = useState(null);

  // Refs for scroll synchronization
  const headerScrollRef = useRef(null);
  const columnScrollRef = useRef(null);
  const bodyHorizontalScrollRef = useRef(null);
  const bodyVerticalScrollRef = useRef(null);

  // Prevent infinite scroll loops
  const isSyncingHorizontal = useRef(false);
  const isSyncingVertical = useRef(false);

  // Scroll synchronization functions
  const syncHorizontalScroll = (scrollX) => {
    if (isSyncingHorizontal.current) return;
    isSyncingHorizontal.current = true;

    headerScrollRef.current?.scrollTo({ x: scrollX, animated: false });
    bodyHorizontalScrollRef.current?.scrollTo({ x: scrollX, animated: false });

    // Reset after a short delay to allow the scroll to complete
    setTimeout(() => {
      isSyncingHorizontal.current = false;
    }, 5);
  };

  const syncVerticalScroll = (scrollY) => {
    if (isSyncingVertical.current) return;
    isSyncingVertical.current = true;

    columnScrollRef.current?.scrollTo({ y: scrollY, animated: false });
    bodyVerticalScrollRef.current?.scrollTo({ y: scrollY, animated: false });

    // Reset after a short delay to allow the scroll to complete
    setTimeout(() => {
      isSyncingVertical.current = false;
    }, 5);
  };

  // Update scroll state and handle availability
  const updateScrollState = (scrollX, scrollY) => {
    setScrollState(prev => {
      const newState = { ...prev };
      if (scrollX !== null) {
        newState.horizontal.offset = scrollX;
        newState.horizontal.canScrollLeft = scrollX > 0;
        newState.horizontal.canScrollRight = scrollX < newState.horizontal.maxOffset;
      }
      if (scrollY !== null) {
        newState.vertical.offset = scrollY;
        newState.vertical.canScrollUp = scrollY > 0;
        newState.vertical.canScrollDown = scrollY < newState.vertical.maxOffset;
      }
      return newState;
    });
  };

  // Scroll handle functions
  const scrollLeft = () => {
    const newOffset = Math.max(0, scrollState.horizontal.offset - scrollSpeed);
    bodyHorizontalScrollRef.current?.scrollTo({ x: newOffset, animated: false });
  };

  const scrollRight = () => {
    const newOffset = Math.min(scrollState.horizontal.maxOffset, scrollState.horizontal.offset + scrollSpeed);
    bodyHorizontalScrollRef.current?.scrollTo({ x: newOffset, animated: false });
  };

  const scrollUp = () => {
    const newOffset = Math.max(0, scrollState.vertical.offset - scrollSpeed);
    bodyVerticalScrollRef.current?.scrollTo({ y: newOffset, animated: false });
  };

  const scrollDown = () => {
    const newOffset = Math.min(scrollState.vertical.maxOffset, scrollState.vertical.offset + scrollSpeed);
    bodyVerticalScrollRef.current?.scrollTo({ y: newOffset, animated: false });
  };

  // Scroll event handlers
  const handleHeaderScroll = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    syncHorizontalScroll(scrollX);
    updateScrollState(scrollX, null);
  };

  const handleColumnScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    syncVerticalScroll(scrollY);
    updateScrollState(null, scrollY);
  };

  const handleBodyHorizontalScroll = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    syncHorizontalScroll(scrollX);
    updateScrollState(scrollX, null);
  };

  const handleBodyVerticalScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    syncVerticalScroll(scrollY);
    updateScrollState(null, scrollY);
  };

  useEffect(() => {
    // Calculate the maximum width needed for the first column
    const tempTextWidths = [];

    table.rows.forEach(rowLabel => {
      const charWidth = 6; // Approximate character width
      const padding = 8; // Left + right padding
      const margin = 2; // Left + right margin
      const calculatedWidth = (rowLabel.length * charWidth) + padding + margin;
      tempTextWidths.push(calculatedWidth);
    });

    const maxContentWidth = Math.max(...tempTextWidths);
    const finalWidth = Math.max(maxContentWidth, 60);
    setFirstColumnWidth(finalWidth);

    // Calculate total table height: header + all rows + padding
    const totalRows = table.rows.length;
    const tableHeight = (totalRows + 1) * (CELL_HEIGHT + 8); // +1 for header row
    const paddingHeight = 16; // Container padding
    const totalHeight = tableHeight + paddingHeight;
    setTableHeight(totalHeight);
  }, [table.rows, table.columns]);

  return (
    <View style={[styles.container, { maxHeight: tableHeight }]}>
      {/* TOP LEFT EMPTY CELL */}
      <View style={[styles.emptyCell, { width: firstColumnWidth, height: CELL_HEIGHT }]}>
        {/* Empty corner cell */}
      </View>

      {/* HEADER ROW - Horizontal Scroll Only */}
      <View style={[styles.headerRowContainer, {
        left: firstColumnWidth,
        right: 8, // Leave space for container padding
      }]}>
        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.headerContent}
          onScroll={handleHeaderScroll}
          scrollEventThrottle={16}
        >
          {table.columns.map((col, index) => (
            <View key={index} style={[styles.headerCell, { width: CELL_WIDTH }]}>
              <Text style={styles.headerText}>{col}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* FIRST COLUMN - Vertical Scroll Only */}
      <ScrollView
        ref={columnScrollRef}
        showsVerticalScrollIndicator={false}
        style={[styles.firstColumn, {
          width: firstColumnWidth,
          top: CELL_HEIGHT,
          bottom: 8, // Fill to bottom of container
        }]}
        onScroll={handleColumnScroll}
        scrollEventThrottle={16}
      >
        {table.rows.map((rowLabel, index) => (
          <View key={index} style={[styles.rowHeaderCell, { height: CELL_HEIGHT }]}>
            <Text style={styles.rowHeaderText}>{rowLabel}</Text>
          </View>
        ))}
      </ScrollView>

      {/* MAIN TABLE BODY - Both Horizontal and Vertical Scroll */}
      <View
        style={[styles.mainBodyContainer, {
          left: firstColumnWidth,
          top: CELL_HEIGHT,
          bottom: 8, // Fill to bottom of container
          right: 8, // Leave space for container padding
        }]}
        onLayout={(event) => {
          setMainTableBodyLayout(event.nativeEvent.layout);
          const { width, height } = event.nativeEvent.layout;
          setViewportSize({ width, height });

          // Update scroll offsets with actual viewport dimensions
          const CELL_MARGIN = 4;
          const totalTableWidth = table.columns.length * CELL_WIDTH + table.columns.length * CELL_MARGIN;
          const totalTableHeight = table.rows.length * CELL_HEIGHT + table.rows.length * CELL_MARGIN;
          const maxHorizontalOffset = Math.max(0, totalTableWidth - width);
          const maxVerticalOffset = Math.max(0, totalTableHeight - height);

          setScrollState(prev => ({
            horizontal: { ...prev.horizontal, maxOffset: maxHorizontalOffset },
            vertical: { ...prev.vertical, maxOffset: maxVerticalOffset },
          }));

          updateScrollState(0, 0); // Trigger state update
        }}
      >
        <ScrollView
          ref={bodyHorizontalScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
          onScroll={handleBodyHorizontalScroll}
          scrollEventThrottle={16}
        >
          <ScrollView
            ref={bodyVerticalScrollRef}
            showsVerticalScrollIndicator={false}
            onScroll={handleBodyVerticalScroll}
            scrollEventThrottle={16}
          >
            {table.cells.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.bodyRow}>
                {row.map((cell, colIndex) => {
                  const isWrongCell = wrongCell &&
                    cell &&
                    cell.row === wrongCell.row &&
                    cell.col === wrongCell.col;

                  return (
                    <TableCell
                      key={`${rowIndex}-${colIndex}`}
                      cell={cell}
                      onPress={(cellRef) => {
                        if (cell) {
                          onCellPress(cell.row, cell.col, cellRef);
                        }
                      }}
                      showAnswer={showAnswers}
                      isHeader={false}
                      isRowHeader={false}
                      dynamicWidth={undefined}
                      isWrong={isWrongCell}
                      isDragOver={getCellIsHovered && getCellIsHovered(cell.row, cell.col)}
                      registerCellLayout={registerCellLayout}
                      blinkingCell={blinkingCell}
                      blinkAnimation={blinkAnimation}
                    />
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Scroll Handles - positioned inside the main body area */}
        <ScrollHandles
          canScrollLeft={scrollState.horizontal.canScrollLeft}
          canScrollRight={scrollState.horizontal.canScrollRight}
          canScrollUp={scrollState.vertical.canScrollUp}
          canScrollDown={scrollState.vertical.canScrollDown}
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
          onScrollUp={scrollUp}
          onScrollDown={scrollDown}
          showHandles={!!draggedVariant} // Only show during drag operations
          dragPosition={dragPosition}
          mainTableBodyLayout={mainTableBodyLayout}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyCell: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  headerRowContainer: {
    position: 'absolute',
    top: 0,
    height: CELL_HEIGHT,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
  },
  headerCell: {
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  firstColumn: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 5,
  },
  rowHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    margin: 2,
  },
  rowHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    fontFamily: 'ComicSansMS',
  },
  mainBodyContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  bodyContent: {
    flexDirection: 'row',
  },
  bodyRow: {
    flexDirection: 'row',
  },
});

export default ScrollableTable;
