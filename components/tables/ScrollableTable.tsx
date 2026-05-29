import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedRef,
  useSharedValue,
  useAnimatedScrollHandler,
  scrollTo,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import TableCell from './TableCell';
import ScrollHandles from './ScrollHandles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TableData } from '../../utils/domain';
import type { DragPosition, LayoutRect, ScrollableTableHandle } from '../../types/ui';

const CELL_WIDTH = 80;
const CELL_HEIGHT = 40;
const SCROLL_STEP = 100;

interface ScrollableTableProps {
  table: TableData;
  onCellPress: (row: number, col: number, cellRef: React.RefObject<View | null>) => void;
  showAnswers?: boolean;
  wrongCell?: { row: number; col: number } | null;
  getCellIsHovered?: (row: number, col: number) => boolean;
  registerCellLayout?: (row: number, col: number, layout: LayoutRect) => void;
  draggedVariant?: string | null;
  dragPosition?: DragPosition | null;
  blinkingCell?: { row: number; col: number } | null;
  blinkAnimation?: SharedValue<number> | null;
}

const ScrollableTable = forwardRef<ScrollableTableHandle, ScrollableTableProps>(({
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
  const [mainTableBodyScreenLayout, setMainTableBodyScreenLayout] = useState<LayoutRect | null>(null);
  const [scrollability, setScrollability] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    canScrollUp: false,
    canScrollDown: false,
  });

  const headerScrollRef = useAnimatedRef<Animated.ScrollView>();
  const columnScrollRef = useAnimatedRef<Animated.ScrollView>();
  const bodyHorizontalScrollRef = useAnimatedRef<Animated.ScrollView>();
  const bodyVerticalScrollRef = useAnimatedRef<Animated.ScrollView>();

  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const maxHorizontalOffset = useSharedValue(0);
  const maxVerticalOffset = useSharedValue(0);

  const previousAnimationIsHappening = useSharedValue(false);

  const updateScrollability = (scrollXVal: number, scrollYVal: number, maxHoriz: number, maxVert: number) => {
    setScrollability({
      canScrollLeft: scrollXVal > 0,
      canScrollRight: scrollXVal < maxHoriz,
      canScrollUp: scrollYVal > 0,
      canScrollDown: scrollYVal < maxVert,
    });
  };

  const handleHorizontalScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (previousAnimationIsHappening.value) {
        return;
      }
      previousAnimationIsHappening.value = true;
      const newScrollX = event.contentOffset.x;
      scrollTo(headerScrollRef, newScrollX, 0, false);
      scrollTo(bodyHorizontalScrollRef, newScrollX, 0, false);
    },

    onMomentumEnd: (event) => {
      const newScrollX = event.contentOffset.x;
      scrollX.value = newScrollX;
      previousAnimationIsHappening.value = false;
      scheduleOnRN(updateScrollability, newScrollX, scrollY.value, maxHorizontalOffset.value, maxVerticalOffset.value);
    },
  });

  const handleVerticalScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (previousAnimationIsHappening.value) {
        return;
      }
      previousAnimationIsHappening.value = true;
      const newScrollY = event.contentOffset.y;
      scrollTo(columnScrollRef, 0, newScrollY, false);
      scrollTo(bodyVerticalScrollRef, 0, newScrollY, false);
    },

    onMomentumEnd: (event) => {
      const newScrollY = event.contentOffset.y;
      scrollY.value = newScrollY;
      previousAnimationIsHappening.value = false;
      scheduleOnRN(updateScrollability, scrollX.value, newScrollY, maxHorizontalOffset.value, maxVerticalOffset.value);
    },
  });

  const uiScrollLeft = (scrollStep: number, animated: boolean) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.max(0, scrollX.value - scrollStep);
    scrollTo(headerScrollRef, newOffset, 0, animated);
    scrollTo(bodyHorizontalScrollRef, newOffset, 0, animated);
  };

  const uiScrollRight = (scrollStep: number, animated: boolean) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.min(maxHorizontalOffset.value, scrollX.value + scrollStep);
    scrollTo(headerScrollRef, newOffset, 0, animated);
    scrollTo(bodyHorizontalScrollRef, newOffset, 0, animated);
  };

  const uiScrollUp = (scrollStep: number, animated: boolean) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.max(0, scrollY.value - scrollStep);
    scrollTo(columnScrollRef, 0, newOffset, animated);
    scrollTo(bodyVerticalScrollRef, 0, newOffset, animated);
  };

  const uiScrollDown = (scrollStep: number, animated: boolean) => {
    'worklet';
    previousAnimationIsHappening.value = true;
    const newOffset = Math.min(maxVerticalOffset.value, scrollY.value + scrollStep);
    scrollTo(columnScrollRef, 0, newOffset, animated);
    scrollTo(bodyVerticalScrollRef, 0, newOffset, animated);
  };

  const scrollLeft = (scrollStep = SCROLL_STEP, animated = true) => {
    scheduleOnUI(uiScrollLeft, scrollStep, animated);
  };

  const scrollRight = (scrollStep = SCROLL_STEP, animated = true) => {
    scheduleOnUI(uiScrollRight, scrollStep, animated);
  };

  const scrollUp = (scrollStep = SCROLL_STEP, animated = true) => {
    scheduleOnUI(uiScrollUp, scrollStep, animated);
  };

  const scrollDown = (scrollStep = SCROLL_STEP, animated = true) => {
    scheduleOnUI(uiScrollDown, scrollStep, animated);
  };

  useImperativeHandle(ref, () => ({
    scrollToCell: (row: number, col: number) => {
      const cellX = col * (CELL_WIDTH + 4);
      const cellY = row * (CELL_HEIGHT + 4);

      const targetX = Math.max(0, cellX - viewportSize.width / 2 + CELL_WIDTH / 2);
      const targetY = Math.max(0, cellY - viewportSize.height / 2 + CELL_HEIGHT / 2);

      const performScroll = (targetXVal: number, targetYVal: number) => {
        'worklet';
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
    },
  }), [viewportSize]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const tempTextWidths: number[] = [];

    table.rows.forEach((rowLabel) => {
      const charWidth = 6;
      const padding = 8;
      const margin = 2;
      const calculatedWidth = (rowLabel.length * charWidth) + padding + margin;
      tempTextWidths.push(calculatedWidth);
    });

    const maxContentWidth = Math.max(...tempTextWidths);
    const finalWidth = Math.max(maxContentWidth, 60);
    setFirstColumnWidth(finalWidth);

    const totalRows = table.rows.length;
    const calculatedTableHeight = (totalRows + 1) * (CELL_HEIGHT + 8);
    const paddingHeight = 16;
    const totalHeight = calculatedTableHeight + paddingHeight;
    setTableHeight(totalHeight);
  }, [table.rows, table.columns]);

  return (
    <View style={[styles.container, { maxHeight: tableHeight }]}>
      <View style={[styles.emptyCell, { width: firstColumnWidth, height: CELL_HEIGHT }]}>
        {/* Empty corner cell */}
      </View>

      <View style={[styles.headerRowContainer, {
        left: firstColumnWidth,
        right: 8,
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

      <Animated.ScrollView
        ref={columnScrollRef}
        showsVerticalScrollIndicator={false}
        style={[styles.firstColumn, {
          width: firstColumnWidth,
          top: CELL_HEIGHT,
          bottom: 8,
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

      <View
        style={[styles.mainBodyContainer, {
          left: firstColumnWidth,
          top: CELL_HEIGHT,
          bottom: 8,
          right: 8,
        }]}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          const { width, height } = layout;
          setViewportSize({ width, height });

          event.target.measureInWindow((x, y, measuredWidth, measuredHeight) => {
            setMainTableBodyScreenLayout({ x, y: y - insets.top, width: measuredWidth, height: measuredHeight });
          });

          const CELL_MARGIN = 4;
          const totalTableWidth = table.columns.length * CELL_WIDTH + table.columns.length * CELL_MARGIN;
          const totalTableHeight = table.rows.length * CELL_HEIGHT + table.rows.length * CELL_MARGIN;
          const maxHoriz = Math.max(0, totalTableWidth - width);
          const maxVert = Math.max(0, totalTableHeight - height);

          maxHorizontalOffset.value = maxHoriz;
          maxVerticalOffset.value = maxVert;
          // Notify JS thread about initial scrollability state so handles show correctly
          updateScrollability(scrollX.value, scrollY.value, maxHorizontalOffset.value, maxVerticalOffset.value);
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
                      isWrong={!!isWrongCell}
                      isDragOver={getCellIsHovered ? getCellIsHovered(cell.row, cell.col) : false}
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

        <ScrollHandles
          canScrollLeft={scrollability.canScrollLeft}
          canScrollRight={scrollability.canScrollRight}
          canScrollUp={scrollability.canScrollUp}
          canScrollDown={scrollability.canScrollDown}
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
          onScrollUp={scrollUp}
          onScrollDown={scrollDown}
          uiScrollLeft={uiScrollLeft}
          uiScrollRight={uiScrollRight}
          uiScrollUp={uiScrollUp}
          uiScrollDown={uiScrollDown}
          showHandles={true}
          dragPosition={dragPosition}
          mainTableBodyLayout={mainTableBodyScreenLayout}
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
