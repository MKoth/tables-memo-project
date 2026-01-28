import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedRef, 
  useSharedValue, 
  useAnimatedScrollHandler,
  scrollTo,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import TableCell from './TableCell';
import ScrollHandles from './ScrollHandles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CELL_WIDTH = 80;
const CELL_HEIGHT = 40;
const SCROLL_STEP = 100;

const ScrollableTable = forwardRef(({
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
}, ref) => {
  const [firstColumnWidth, setFirstColumnWidth] = useState(80);
  const [tableHeight, setTableHeight] = useState(300);
  const [viewportSize, setViewportSize] = useState({ width: 400, height: 300 });
  const [mainTableBodyScreenLayout, setMainTableBodyScreenLayout] = useState(null);
  const [scrollability, setScrollability] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    canScrollUp: false,
    canScrollDown: false,
  });

  // Animated refs for scroll synchronization
  const headerScrollRef = useAnimatedRef();
  const columnScrollRef = useAnimatedRef();
  const bodyHorizontalScrollRef = useAnimatedRef();
  const bodyVerticalScrollRef = useAnimatedRef();

  // Shared values for scroll positions - single source of truth
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const maxHorizontalOffset = useSharedValue(0);
  const maxVerticalOffset = useSharedValue(0);

  const previousAnimationIsHappening = useSharedValue(false);

  // Update scrollability state from worklet
  const updateScrollability = (scrollXVal, scrollYVal, maxHoriz, maxVert) => {
    setScrollability({
      canScrollLeft: scrollXVal > 0,
      canScrollRight: scrollXVal < maxHoriz,
      canScrollUp: scrollYVal > 0,
      canScrollDown: scrollYVal < maxVert,
    });
  };

  // Horizontal scroll synchronization
  const handleHorizontalScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (previousAnimationIsHappening.value) {
        return;
      }
      previousAnimationIsHappening.value = true;
      const newScrollX = event.contentOffset.x;
      // Sync header and body horizontal scrolls
      scrollTo(headerScrollRef, newScrollX, 0, false);
      scrollTo(bodyHorizontalScrollRef, newScrollX, 0, false);
    },

    onMomentumEnd: (event) => {
      const newScrollX = event.contentOffset.x;
      scrollX.value = newScrollX;
      previousAnimationIsHappening.value = false;
      // Update scrollability state
      scheduleOnRN(updateScrollability, newScrollX, scrollY.value, maxHorizontalOffset.value, maxVerticalOffset.value);
    }
  });

  // Vertical scroll synchronization
  const handleVerticalScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (previousAnimationIsHappening.value) {
        return;
      }
      previousAnimationIsHappening.value = true;
      const newScrollY = event.contentOffset.y;
      // Sync column and body vertical scrolls
      scrollTo(columnScrollRef, 0, newScrollY, false);
      scrollTo(bodyVerticalScrollRef, 0, newScrollY, false);
    },

    onMomentumEnd: (event) => {
      const newScrollY = event.contentOffset.y;
      scrollY.value = newScrollY;
      previousAnimationIsHappening.value = false;
      // Update scrollability state
      scheduleOnRN(updateScrollability, scrollX.value, newScrollY, maxHorizontalOffset.value, maxVerticalOffset.value);
    }
  });

  // Scroll handle functions - regular functions that use worklet internally should run on UI thread
  const uiScrollLeft = (scrollStep) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.max(0, scrollX.value - scrollStep);
    scrollTo(headerScrollRef, newOffset, 0, true);
    scrollTo(bodyHorizontalScrollRef, newOffset, 0, true);
  };

  const uiScrollRight = (scrollStep) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.min(maxHorizontalOffset.value, scrollX.value + scrollStep);
    scrollTo(headerScrollRef, newOffset, 0, true);
    scrollTo(bodyHorizontalScrollRef, newOffset, 0, true);
  };

  const uiScrollUp = (scrollStep) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.max(0, scrollY.value - scrollStep);
    scrollTo(columnScrollRef, 0, newOffset, true);
    scrollTo(bodyVerticalScrollRef, 0, newOffset, true);
  };

  const uiScrollDown = (scrollStep) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.min(maxVerticalOffset.value, scrollY.value + scrollStep);
    scrollTo(columnScrollRef, 0, newOffset, true);
    scrollTo(bodyVerticalScrollRef, 0, newOffset, true);
  };

  const scrollLeft = (scrollStep = SCROLL_STEP) => {
    scheduleOnUI(uiScrollLeft, scrollStep);
  };

  const scrollRight = (scrollStep = SCROLL_STEP) => {
    scheduleOnUI(uiScrollRight, scrollStep);
  };

  const scrollUp = (scrollStep = SCROLL_STEP) => {
    scheduleOnUI(uiScrollUp, scrollStep);
  };

  const scrollDown = (scrollStep = SCROLL_STEP) => {
    scheduleOnUI(uiScrollDown, scrollStep);
  };

  // Expose scrollToCell method via ref
  useImperativeHandle(ref, () => ({
    scrollToCell: (row, col) => {
      // Calculate target scroll positions to center the cell
      const cellX = col * (CELL_WIDTH + 4); // 4 is margin
      const cellY = row * (CELL_HEIGHT + 4);

      const targetX = Math.max(0, cellX - viewportSize.width / 2 + CELL_WIDTH / 2);
      const targetY = Math.max(0, cellY - viewportSize.height / 2 + CELL_HEIGHT / 2);

      // Use worklet and scheduleOnUI to update shared values and scroll
      const performScroll = (targetXVal, targetYVal) => {
        'worklet';
        // Clamp to max offsets
        const clampedX = Math.min(targetXVal, maxHorizontalOffset.value);
        const clampedY = Math.min(targetYVal, maxVerticalOffset.value);

        scrollX.value = clampedX;
        scrollY.value = clampedY;
        scrollTo(headerScrollRef, clampedX, 0, true);
        scrollTo(bodyHorizontalScrollRef, clampedX, 0, true);
        scrollTo(columnScrollRef, 0, clampedY, true);
        scrollTo(bodyVerticalScrollRef, 0, clampedY, true);
      };
      scheduleOnUI(performScroll, targetX, targetY);
    }
  }), [viewportSize]);

  const insets = useSafeAreaInsets();

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
        <Animated.ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.headerContent}
          onScroll={handleHorizontalScroll}
          scrollEventThrottle={16}
        >
          {table.columns.map((col, index) => (
            <View key={index} style={[styles.headerCell, { width: CELL_WIDTH }]}>
              <Text style={styles.headerText}>{col}</Text>
            </View>
          ))}
        </Animated.ScrollView>
      </View>

      {/* FIRST COLUMN - Vertical Scroll Only */}
      <Animated.ScrollView
        ref={columnScrollRef}
        showsVerticalScrollIndicator={false}
        style={[styles.firstColumn, {
          width: firstColumnWidth,
          top: CELL_HEIGHT,
          bottom: 8, // Fill to bottom of container
        }]}
        onScroll={handleVerticalScroll}
        scrollEventThrottle={16}
      >
        {table.rows.map((rowLabel, index) => (
          <View key={index} style={[styles.rowHeaderCell, { height: CELL_HEIGHT }]}>
            <Text style={styles.rowHeaderText}>{rowLabel}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      {/* MAIN TABLE BODY - Both Horizontal and Vertical Scroll */}
      <View
        style={[styles.mainBodyContainer, {
          left: firstColumnWidth,
          top: CELL_HEIGHT,
          bottom: 8, // Fill to bottom of container
          right: 8, // Leave space for container padding
        }]}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          const { width, height } = layout;
          setViewportSize({ width, height });

          // Measure screen coordinates and adjust for header offset
          event.target.measureInWindow((x, y, width, height) => {
            setMainTableBodyScreenLayout({ x, y: y - insets.top, width, height });
          });

          // Update max scroll offsets with actual viewport dimensions
          const CELL_MARGIN = 4;
          const totalTableWidth = table.columns.length * CELL_WIDTH + table.columns.length * CELL_MARGIN;
          const totalTableHeight = table.rows.length * CELL_HEIGHT + table.rows.length * CELL_MARGIN;
          const maxHoriz = Math.max(0, totalTableWidth - width);
          const maxVert = Math.max(0, totalTableHeight - height);

          maxHorizontalOffset.value = maxHoriz;
          maxVerticalOffset.value = maxVert;
        }}
      >
        <Animated.ScrollView
          ref={bodyHorizontalScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
          onScroll={handleHorizontalScroll}
          scrollEventThrottle={16}
        >
          <Animated.ScrollView
            ref={bodyVerticalScrollRef}
            showsVerticalScrollIndicator={false}
            onScroll={handleVerticalScroll}
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
          </Animated.ScrollView>
        </Animated.ScrollView>

        {/* Scroll Handles - positioned inside the main body area */}
        <ScrollHandles
          canScrollLeft={scrollability.canScrollLeft}
          canScrollRight={scrollability.canScrollRight}
          canScrollUp={scrollability.canScrollUp}
          canScrollDown={scrollability.canScrollDown}
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
          onScrollUp={scrollUp}
          onScrollDown={scrollDown}
          showHandles={true} // Always show
          dragPosition={dragPosition}
          mainTableBodyLayout={mainTableBodyScreenLayout}
          previousAnimationIsHappening={previousAnimationIsHappening}
        />
      </View>
    </View>
  );
});

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
