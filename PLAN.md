# Tables-Memo App Development Plan

## Overview
Mobile app for memorizing grammar tables and words using flashcard-style exercises with spaced repetition and animations.

## Features
- User authentication and language/project selection
- Table learning with multiple exercise types and animations
- Word learning with various exercises and hints
- Custom table creation from existing tables
- Spaced repetition algorithm
- AI chatbot for personal project setup

## Technical Stack
- React Native with Expo (web testing support)
- React Navigation for routing
- React Native Animated for animations
- AsyncStorage for local data persistence
- Context API for state management

## Project Structure
```
tables-memo/
├── .gitignore
├── App.js
├── app.json
├── index.js
├── package.json
├── package-lock.json
├── PLAN.md
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   ├── splash-icon.png
├── components/
│   ├── shared/          # Shared components
│   │   └── VerticalArrowedScrollView.js
│   ├── tables/          # Table-specific components
│   │   ├── DragOverlay.js
│   │   ├── ScrollableTable.js
│   │   ├── ScrollHandles.js
│   │   ├── TableCell.js
│   │   ├── TransformationWorkspace.js
│   │   └── VariantsList.js
│   └── words/           # Word-specific components (placeholders)
├── context/
├── data/
├── navigation/
│   ├── AppNavigator.js
├── screens/
│   ├── auth/
│   │   └── LoginScreen.js
│   ├── selection/
│   │   ├── LanguageSelectionScreen.js
│   │   ├── LearningTypeSelectionScreen.js
│   │   ├── TopicSelectionScreen.js
│   │   └── ExerciseSelectionScreen.js
│   └── exercises/
│       ├── tables/
│       │   ├── FillCellsExerciseScreen.js
│       │   └── WordTransformationExerciseScreen.js
│       └── words/       # Word exercise placeholders
│           ├── MultipleChoiceExerciseScreen.js
│           ├── TypingExerciseScreen.js
│           └── MatchingExerciseScreen.js
├── utils/
│   ├── types.js
└── ...
```

## ✅ COMPLETED: App Architecture Reorganization

### **New Navigation Flow**
The app navigation has been completely reorganized for better scalability and user experience:

1. **Login** → 2. **Language Selection** → 3. **Learning Type** (Tables/Words) → 4. **Topic Selection** → 5. **Exercise Selection** → 6. **Exercise**

### **Key Improvements**
- **Unified Topic Selection**: Single screen that adapts to show tables or words based on learning type
- **Modular Exercise Structure**: Separate folders for table and word exercises
- **Component Organization**: Components grouped by domain (shared, tables, words)
- **Scalable Architecture**: Easy to add new exercise types and learning categories

### **Current Implementation Status**
- ✅ **Table Exercises**: Fill Cells, Word Transformations (fully implemented)
- ⏳ **Word Exercises**: Multiple Choice, Typing, Matching (placeholder screens)
- ✅ **Navigation Flow**: Complete and tested
- ✅ **Component Structure**: Properly organized by domain

### **Future Expansion Ready**
- Word exercise placeholders created for easy implementation
- Component structure supports adding shared components when both table and word exercises need them
- Navigation structure supports additional learning types beyond tables/words

## Development Phases
1. [x] Set up Expo React Native project with web support
2. [x] Implement project structure and navigation
3. [x] Create authentication screens and logic
4. [x] Build data models for tables, words, and users
5. [x] Implement table selection and basic table view
6. [x] Develop table exercises with animations - **COMPLETED: Fill Cells Exercise**
7. [x] Implement word learning exercises - **COMPLETED: Word Transformations Exercise**
8. [ ] Add spaced repetition algorithm
9. [ ] Integrate AI chatbot for personal projects
10. [ ] Add custom table creation feature
11. [ ] Polish UI/UX and add comprehensive testing

## Detailed Feature Breakdown

### Authentication & User Management
- Email/password login (Firebase integration planned)
- User profiles with language preferences

### Language/Project Selection
- Predefined languages dropdown
- Personal projects via AI-assisted creation

### Table Learning Flow
- Multi-select tables with tag filtering
- Exercise 1: Fill cells with variants (floating animation reveal)
- Exercise 2: Place 1 variant into cells (drag/tap with animations)
- Exercise 3: Word transformations (letter manipulation with sequence animations)
- Exercise 4: Sentence fitting (word insertion with floating animations)

### Word Learning Flow
- Multi-select words/categories or spaced repetition queue
- Multiple choice translations
- Typing/audio input exercises
- Matching columns
- Progressive hints (sentences, associations)

### Custom Tables
- Combine tables (e.g., tenses × persons)
- Drag-and-drop row/column reordering
- Preview and save functionality

## ✅ COMPLETED: Fill Cells Exercise Implementation

### **Core Features Implemented**
- **Interactive Table**: Click-to-place conjugation variants in table cells
- **Excel-like Scrollable Table**: Four synchronized scroll areas (header row, first column, main body)
- **Dynamic Column Sizing**: First column auto-sizes to content, remaining columns share space proportionally
- **Variant Selection**: Horizontal scrolling list with selection feedback and height constraints
- **Immediate Feedback System**:
  - ✅ Correct: "Great job!!!" (green banner)
  - ❌ Wrong: "Wrong choice!!! Don't worry, just try again!" (red banner + temporary red cell)
  - 🎉 Complete: "Well done!!! You completed all cells!" (green banner)
- **Smart Variant Management**: Variants return to list when replaced, preventing permanent loss
- **Answer Reveal**: "Show Answers" button with floating animations to correct positions
- **Responsive Design**: Full-width table with proper mobile adaptation and flexible layout

### **Technical Implementation**
- **Components Created**:
  - `TableExerciseScreen.js` - Main exercise orchestration with flexible layout
  - `ScrollableTable.js` - Excel-like table with synchronized scrolling areas
  - `TableCell.js` - Individual cells with conditional styling
  - `VariantsList.js` - Animated variant selection list with scrolling
- **Scroll Synchronization**: JavaScript-powered synchronization between all table areas
- **Data Structures**: Complete table and exercise state management
- **Animations**: React Native Animated API with spring physics for floating effects
- **State Management**: Proper feedback timing with timeout reset prevention

### **User Experience Features**
- **Visual Feedback**: Color-coded cells (green=correct, red=wrong, gray=empty)
- **Progress Tracking**: Real-time correct/incorrect counts
- **Error Recovery**: Encouraging messages and automatic variant restoration
- **Scrollable Interface**: Excel-like table navigation with synchronized scroll areas
- **Flexible Layout**: Table takes remaining space, variants constrained to 50vh with internal scrolling
- **Accessibility**: Clear visual hierarchy and responsive touch targets

## ✅ COMPLETED: UI/UX Polish & Styling Improvements

### **Compact Design Optimization**
- **Table Cells**: Reduced dimensions (80x40px), tighter margins and padding
- **Font Sizes**: Optimized throughout (Comic Sans MS, 18px titles, 14px content, 12px headers)
- **Layout**: Compact header (8px padding), reduced container margins
- **Buttons**: Smaller padding and border radius for cleaner appearance

### **Visual Design Enhancements**
- **Color Scheme**: Green table cells (#e7efe9 empty, #9ed69e filled) with purple variants (#e6e6fa normal, #a089d1 selected)
- **Typography**: Comic Sans MS font throughout for playful, comic-book aesthetic
- **Borderless Design**: Removed all borders for modern, clean appearance
- **Animation Consistency**: Flying variant matches selected variant purple color

### **Interaction Improvements**
- **Scroll Indicators**: Hidden scroll bars for cleaner appearance
- **Visual Feedback**: Clear color coding and selection states
- **Responsive Layout**: Optimized spacing and proportions for mobile

## ✅ COMPLETED: Advanced Drag & Drop Implementation

### **Core Drag & Drop Features**
- **Full Drag & Drop**: Variants can be dragged from the list and dropped onto table cells
- **Cross-Component Dragging**: Global drag overlay allows dragging across component boundaries
- **Real-time Hover Detection**: Table cells highlight when drag position hovers over them
- **Smart Drop Validation**: Only allows dropping on empty cells with correct answers
- **Visual Feedback**: Dragged variants show scaling animation and opacity changes

### **Libraries Used**
- **react-native-gesture-handler@2.30.0**: Advanced gesture recognition for smooth drag interactions
- **react-native-reanimated@4.2.1**: High-performance animations and worklets for 60fps drag animations
- **react-native-worklets**: Modern threading utilities for cross-thread communication
- **@expo/vector-icons@14.0.2**: Ionicons for scroll handle arrows

### **Scroll Handles (Arrows) System**
- **Dynamic Scroll Handles**: Directional arrows (← → ↑ ↓) appear during drag operations
- **Smart Visibility**: Handles only show when scrolling is possible in each direction
- **Auto-Scrolling**: Dragging near table edges automatically triggers scrolling
- **Manual Control**: Tap arrows for precise 10px scroll increments
- **Edge Detection**: 100px detection zones around table borders for auto-scrolling
- **Visual States**: Available directions show in dark gray, unavailable disappear
- **Hover Activation**: Handles appear immediately when dragging starts

### **Technical Implementation Details**

#### **Gesture Handling**
- **Pan Gestures**: Uses `Gesture.Pan()` from react-native-gesture-handler
- **Worklet Functions**: Drag logic runs on UI thread for smooth 60fps performance
- **Cross-Thread Communication**: `scheduleOnRN()` schedules JS thread callbacks from worklets

#### **Component Architecture**
- **DraggableVariant**: Individual variant with pan gesture and animated styles
- **DragOverlay**: Global overlay component for cross-component dragging
- **ScrollHandles**: Dynamic arrow controls positioned absolutely within table
- **ScrollableTable**: Enhanced with drag position tracking and hover detection

#### **Animation System**
- **Worklet-Based Animations**: All animations run on UI thread using `useAnimatedStyle`
- **Shared Values**: `useSharedValue` for reactive state management
- **Scale Effects**: Dragged variants scale to 1.1x, hover cells scale to 1.05x
- **Color Transitions**: Smooth background color changes for hover states

#### **Scroll Integration**
- **Dynamic Viewport**: Real viewport dimensions measured with `onLayout`
- **Scroll State Tracking**: Monitors scroll position and available scroll ranges
- **Edge-Based Auto-Scroll**: Automatic scrolling when dragging near table boundaries
- **Handle Positioning**: Arrows positioned at table edges with proper z-indexing

### **User Experience Features**
- **Intuitive Dragging**: Natural pan gestures for moving variants
- **Visual Cues**: Selected variants highlighted, drag overlays visible
- **Hover Feedback**: Table cells change to greyish green background on hover
- **Scroll Assistance**: Automatic and manual scrolling during drag operations
- **Error Prevention**: Invalid drops rejected with appropriate feedback
- **Performance**: Smooth 60fps animations with no jank or stuttering

### **Code Quality Improvements**
- **Modern APIs**: Replaced deprecated `runOnJS` with `scheduleOnRN`
- **Thread Safety**: Proper cross-thread communication patterns
- **Memory Management**: Clean up of timers and animation references
- **Type Safety**: Proper prop types and error boundaries
- **Accessibility**: Screen reader support and touch target sizing

## ✅ COMPLETED: Word Transformations Exercise Implementation

### **Core Features Implemented**
- **Diff-Based Operations**: Automatic generation of transformation steps using DiffMatchPatch algorithm
- **Interactive Word Manipulation**: Users select letters to delete or choose variants to insert
- **Pre-Generated Variants**: Wrong answer options created from actual table transformations (stable, non-regenerating)
- **Blinking Target Cell**: Visual indicator showing which table cell corresponds to current operation
- **Scrollable Workspace**: Vertical scrolling with up/down arrows for mobile content overflow
- **Grammatical Context**: Complete conjugation rules displayed when "Show Tip" is pressed

### **Technical Implementation**
- **Components Created**:
  - `WordTransformationExerciseScreen.js` - Main exercise orchestration
  - `TransformationWorkspace.js` - Scrollable container for word display and tools
  - `WordDisplay.js` - Interactive letter selection component
  - `TransformationTools.js` - Hint system and action buttons
  - `VerticalArrowedScrollView.js` - Shared scrollable component with arrows
- **Libraries Used**:
  - `diff-match-patch@1.0.7` - Automatic operation generation from text differences
  - `react-native-reanimated@4.2.1` - Smooth blinking animations
- **Data Structures**: Complete rewrite of transformation logic to use operations instead of hardcoded steps

### **Algorithm Overview**
```javascript
// Example: "hablar" → "hablo"
const diff = dmp.diff_main("hablar", "hablo");
// Result: [["equal", "habl"], ["delete", "a"], ["insert", "o"]]
const operations = diffToOps("hablar", diff);
// Result: [{type: "delete", index: 4, length: 1}, {type: "insert", index: 4, text: "o"}]
```

### **User Experience Features**
- **Guided Transformations**: Step-by-step word building with clear visual feedback
- **Stable Variants**: Wrong choices don't change during exercise (pre-generated)
- **Mobile-Optimized**: Vertical scrolling with touch-friendly arrows
- **Educational**: Complete grammar rules for each verb type (-ar, -er, -ir)
- **Progressive Difficulty**: Operations auto-generated for any conjugation complexity

### **Smart Variant Generation**
- **Context-Aware**: Wrong options drawn from actual table transformations
- **Fallback System**: Random string generation if table lacks variety
- **Performance Optimized**: Variants generated once during exercise initialization
- **Stable Display**: No flickering or regeneration during user interaction

### **Mobile-First Design**
- **Scrollable Content**: Workspace scrolls vertically with up/down arrows
- **Touch Targets**: Large 50px letter buttons, 70px variant buttons
- **Responsive Layout**: Adapts to any screen size with proper content flow
- **Visual Hierarchy**: Clear distinction between current word, operations, and hints

## ✅ COMPLETED: Word Transformations Exercise with Flying Animation

### **Core Animation Features Implemented**
- **Word-Flying Animation**: Completed words animate smoothly from workspace to target table cell
- **Scale Transition**: Words shrink from full size to 60% during 400ms flight animation
- **Scroll Coordination**: Table and workspace scroll automatically for optimal viewing
- **Sequential Progression**: Smooth transition between cells with proper blinking indicators
- **Visual Feedback**: Purple flying overlay matches the app's design theme

### **Technical Animation Implementation**
- **React Native Animated**: Position and scale animations with `Easing.out(Easing.cubic)`
- **useEffect State Management**: Proper handling of state changes for scroll triggers
- **Ref-Based Positioning**: Accurate word and cell position measurements
- **Async Animation Flow**: Coordinated scrolling and animation timing

### **Remaining Enhancements**
- [ ] **UX/UI Refinements**:
  - [ ] Haptic feedback for interactions
  - [ ] Sound effects for correct/incorrect feedback
  - [ ] Loading states and smooth transitions
  - [ ] Accessibility improvements (screen reader support)
- [ ] **Advanced Features**:
  - [ ] Undo/redo functionality
  - [ ] Hint system with progressive reveals
  - [ ] Performance statistics and streak tracking
  - [ ] Multiple difficulty levels
  - [ ] Custom table support

### **Technical Improvements**
- [x] **Animation Performance**: Optimize with `useNativeDriver` and reduce re-renders
- [ ] **Memory Management**: Proper cleanup of timers and animation references
- [ ] **Error Boundaries**: Graceful error handling for edge cases
- [ ] **Testing**: Unit tests for components and integration tests for workflows

### Animations
- Floating pieces for cell placement
- Transformation sequences for word modifications
- Word floating to sentence positions
- Smooth view transitions

### Spaced Repetition
- SM-2 algorithm implementation
- Performance tracking per item
- Intelligent review scheduling

### AI Chatbot
- Natural language processing for project descriptions
- Structured data generation from user input

## Dependencies
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- @react-native-async-storage/async-storage
- react-native-animatable (or use Animated)
- Additional libraries as needed for specific features

## Testing Strategy
- Unit tests with Jest
- Browser testing via Expo web
- Mobile testing on iOS/Android simulators
