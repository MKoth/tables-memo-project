export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface FeedbackMessage {
  type: 'success' | 'error' | 'completion';
  text: string;
}

export interface ScrollableTableHandle {
  scrollToCell: (row: number, col: number) => void;
}

export interface ScrollWorkspaceHandle {
  scrollTo: (options: { y: number; animated?: boolean }) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}
