# TypeScript migration — file-by-file effort assessment

**Total files:** 28 `.js` / `.jsx`  
**Total lines:** ~7 300  
**Effort key:** XS < 0.5 h · S 0.5–1 h · M 1–2 h · L 2–4 h · XL 4–8 h

> Files are ordered by the recommended migration sequence (dependencies first).  
> Hours are calendar-work estimates for a developer already familiar with the codebase.

---

## Phase 0 — Bootstrapping (do once, not per-file)

| Task | Effort |
|------|--------|
| Install `typescript`, `@types/react`, `@types/react-native`, Expo TS template pieces, generate `tsconfig.json` | S |
| Add `declare module '*.ttf'` asset declaration | XS |
| Verify `@types/diff-match-patch` covers `diff_main` return type; add `// @ts-ignore` shim or custom `.d.ts` if not | XS |
| Check `@sindresorhus/transliterate` ships its own types (ESM package); add shim if missing | XS |

---

## Phase 1 — Domain types (prerequisite for everything downstream)

### `utils/types.js` → `utils/types.ts`
| | |
|---|---|
| **Lines** | 577 |
| **Effort** | **XL — 5–7 h** |
| **Rename to** | `utils/domain.ts` (avoids confusion with `.d.ts`) |

**Key friction points:**

- **15+ factory return types** need explicit interfaces: `CellData`, `TableData`, `FillCellsExercise`, `WordTransformationExercise`, `SentenceFittingExercise`, `MatchingColumnsExercise`, `MultipleChoiceExercise`, `TypingExercise`, `WordOperationSequence`, `Operation`, `MatchQuestion`, `TypingQuestion`, `WordItem`, `LayoutRect`, …
- `OPERATION_TYPES` should become `const OPERATION_TYPES = { DELETE: 'delete', INSERT: 'insert' } as const` and export `type OperationType = typeof OPERATION_TYPES[keyof typeof OPERATION_TYPES]`
- `op.variants = …` mutation in `generateWordOperations` (line ~371) needs the field added to the `Operation` interface as optional, or a separate `OperationWithVariants` discriminated type
- `diffToOps` builds `{ type: "delete" | "insert", index: number, length?: number, text?: string }[]` — define a `DiffOp` type
- `sentenceMappings` keys use homoglyph infinitives — narrow to `Record<string, string>` or a literal union
- `allGrammarRulesExplanations` / `tableGrammarRuleMapping` are string-keyed objects — type as `Record<string, Record<string, string>>` or define exhaustive literal key unions
- `diff-match-patch` default import: confirm `@types/diff-match-patch` covers the constructor + `diff_main`
- **This file is the blocker for every exercise screen and several components** — convert it first

---

## Phase 2 — Navigation contract

### `navigation/AppNavigator.js` → `navigation/AppNavigator.tsx`
| | |
|---|---|
| **Lines** | 95 |
| **Effort** | **M — 1.5 h** |

**Key friction points:**

- Define `RootStackParamList` covering all 11 routes with their param shapes:
  ```ts
  type RootStackParamList = {
    Login: undefined;
    LanguageSelection: undefined;
    LearningTypeSelection: { selectedLanguage: Language | null };
    TopicSelection: { selectedLanguage: Language | null; learningType: 'tables' | 'words' };
    ExerciseSelection: { selectedLanguage: Language | null; learningType: 'tables' | 'words'; selectedTopics: string[] };
    FillCellsExercise: { ... };
    WordTransformationExercise: { ... };
    SentenceFittingExercise: { ... };
    MultipleChoiceTranslationExercise: { ... };
    TypingTranslationExercise: { ... };
    MatchingColumnsExercise: { ... };
  };
  ```
- Export this type for every screen to use via `NativeStackScreenProps<RootStackParamList, 'ScreenName'>`
- The component body is otherwise trivial JSX — no state, no logic

**Unblocks:** all 11 screen files

---

## Phase 3 — Entry points

### `index.js` → `index.ts`
| | |
|---|---|
| **Lines** | 8 |
| **Effort** | **XS — < 5 min** |

Rename only. `registerRootComponent` is already typed by Expo.

---

### `App.js` → `App.tsx`
| | |
|---|---|
| **Lines** | 48 |
| **Effort** | **S — 30 min** |

**Key friction points:**

- `useState<boolean>(false)` for `fontsLoaded`
- `require('./assets/fonts/ComicSansMS.ttf')` needs the `declare module '*.ttf'` shim from Phase 0
- `Font.loadAsync` return type is `Promise<void>` — already typed by `expo-font`
- `configureReanimatedLogger` should already be typed by `react-native-reanimated`

---

## Phase 4 — Shared components (no domain type dependency)

### `components/shared/VerticalArrowedScrollView.js` → `.tsx`
| | |
|---|---|
| **Lines** | 139 |
| **Effort** | **M — 1.5–2 h** |

**Key friction points:**

- Rest-spread `...scrollViewProps` forwarded to `<ScrollView>` — type as `Omit<ScrollViewProps, 'ref' | 'onScroll' | 'scrollEventThrottle' | 'onContentSizeChange' | 'onLayout'>` or use intersection, then add explicit named props on top
- `scrollViewProps.ref?.current` hack on line 60 — this will surface the missing `forwardRef` wrapper; migration is the time to add `forwardRef` and expose a typed `scrollTo` / `scrollToTop` imperative handle (needed by `TransformationWorkspace` and `SentenceFittingExerciseScreen`)
- `@expo/vector-icons` `Ionicons` name prop — `ComponentProps<typeof Ionicons>['name']` or cast string literals
- `scrollRef` typed as `useRef<ScrollView>(null)`
- `NativeSyntheticEvent<NativeScrollEvent>` for the `handleScroll` event parameter

---

### `components/shared/CircularCountdown.js` → `.tsx`
| | |
|---|---|
| **Lines** | 119 |
| **Effort** | **S — 45 min** |

**Key friction points:**

- Props interface: all primitive (`number`, `string`, `() => void`) — straightforward
- `useRef(new Animated.Value(0))` → `useRef<Animated.Value>(new Animated.Value(0))`
- `animatedValue.addListener` callback parameter `{ value: number }`
- SVG `Circle` and `Svg` from `react-native-svg` — typed once `@types/react-native-svg` or the package's bundled types are present

---

## Phase 5 — Table components (depend on domain types from Phase 1)

### `components/tables/AnimatedLetter.js` → `.tsx`
| | |
|---|---|
| **Lines** | 72 |
| **Effort** | **S — 45 min** |

**Key friction points:**

- Props: `letter: string`, `index: number`, `selected: boolean`, `disabled: boolean`, `onPress: (letter: string, index: number) => void`, `animationOrderIndex?: number`, `totalLetters?: number`, `mode?: 'idle' | 'entering'`, `position?: { left: number; top: number }`
- Reanimated `FadeIn`, `FadeOut`, `LinearTransition` entering/exiting props — types ship with `react-native-reanimated`

---

### `components/tables/AnimatedWord.js` → `.tsx`
| | |
|---|---|
| **Lines** | 153 |
| **Effort** | **M — 1.5 h** |

**Key friction points:**

- Internal `Letter` type: `{ id: string; char: string; orderIndex: number; animationOrderIndex: number }`
- `sequence` prop uses `WordOperationSequence` type from `utils/domain.ts` (Phase 1 dependency)
- `operation` prop: `Operation | undefined`
- `selectedLetters: Set<number>`
- `wordDisplayRef: React.RefObject<View>`
- `onLetterPress: (letter: string, index: number) => void`
- `setTimeout` return: `ReturnType<typeof setTimeout>` or `number` (React Native uses `number`)
- String comparison `operation?.type !== OPERATION_TYPES.DELETE` will narrow correctly once `OPERATION_TYPES` is `as const`

---

### `components/tables/DragOverlay.js` → `.tsx`
| | |
|---|---|
| **Lines** | 62 |
| **Effort** | **S — 30 min** |

**Key friction points:**

- Props: `draggedVariant: string | null`, `dragPosition: SharedValue<{x: number; y: number}>`, `isDragging: boolean`, `customVariantStyles?: ViewStyle`, `customTextStyles?: TextStyle`
- `useAnimatedStyle` dependency array typing — confirm `dragPosition` is a `SharedValue` or plain state; currently passed as plain `{x, y}` object from `FillCellsExerciseScreen` — clarify at call site
- `useSafeAreaInsets` typed by `react-native-safe-area-context`

---

### `components/tables/ScrollHandles.js` → `.tsx`
| | |
|---|---|
| **Lines** | 159 |
| **Effort** | **M — 1.5 h** |

**Key friction points:**

- Two components: `ScrollHandle` and `ScrollHandles`
- `ScrollHandle` props: `direction: 'left' | 'right' | 'up' | 'down'`, `onPress: () => void`, `visible: boolean`
- `ScrollHandles` props: `canScrollLeft/Right/Up/Down: boolean`, scroll handlers, `showHandles: boolean`, `dragPosition: {x: number; y: number} | null`, `mainTableBodyLayout: {x: number; y: number; width: number; height: number} | null`, `previousAnimationIsHappening: SharedValue<boolean>`
- `previousAnimationIsHappening.value` read in render body (non-worklet) — this may warn under strict Reanimated types
- `Ionicons` name literals (same as `VerticalArrowedScrollView`)
- `getPositionStyle` return typed as `ViewStyle`

---

### `components/tables/TableCell.js` → `.tsx`
| | |
|---|---|
| **Lines** | 191 |
| **Effort** | **M — 1.5–2 h** |

**Key friction points:**

- `cell` prop: `CellData | null` (nullable — several `cell &&` guards)
- `registerCellLayout?: (row: number, col: number, layout: LayoutRect) => void`
- `blinkingCell?: { row: number; col: number } | null`
- `blinkAnimation?: SharedValue<number> | null` (prop passed but unused internally — may drop or keep as future hook)
- `cellRef = useRef<TouchableOpacity>(null)` — then `cellRef.current.measureInWindow(...)` which returns `void`; callback `(x, y, width, height) => void` needs explicit params
- `useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withTiming` — all typed by Reanimated

---

### `components/tables/TransformationWorkspace.js` → `.tsx`
| | |
|---|---|
| **Lines** | 218 |
| **Effort** | **M — 1.5–2 h** |

**Key friction points:**

- `forwardRef` passing `ref` through to `VerticalArrowedScrollView` — but `VerticalArrowedScrollView` is **not** a `forwardRef` component yet (Phase 4 work must come first or happen here)
- Once `VerticalArrowedScrollView` exposes a handle, declare `TransformationWorkspaceHandle` (likely the same scroll handle)
- Inner `TransformationTools` sub-component props: `operation: Operation | null`, `sequence: WordOperationSequence | null`, `selectedLetters: Set<number>`, callbacks
- `OPERATION_TYPES` narrowing, `allGrammarRulesExplanations`, `tableGrammarRuleMapping` types from `utils/domain.ts`
- `operation.variants` — available only on `INSERT` operations; discriminated union will require a type guard or `as OperationWithVariants`

---

### `components/tables/VariantsList.js` → `.tsx`
| | |
|---|---|
| **Lines** | 213 |
| **Effort** | **M/L — 2–3 h** |

**Key friction points:**

- Two components: `DraggableVariant` and `VariantsList`
- `DraggableVariant` uses `Gesture.Pan()` with worklet callbacks — `onStart`, `onUpdate`, `onEnd` all have `'worklet'` directive; `scheduleOnRN(onDragStart, variant)` — `onDragStart` must be typed as `(variant: string) => void`
- `dragOffset: SharedValue<{x: number; y: number}>`, `isDragging: SharedValue<boolean>` — `useSharedValue` generics
- `useAnimatedStyle` dependency array with `isBeingDragged` and `isSelected` — these are plain booleans, not shared values; the array is used for memo optimization (Reanimated API)
- `GestureDetector`, `Gesture` types from `react-native-gesture-handler`
- `scheduleOnRN` type signature from `react-native-worklets` — may need a custom declaration

---

## Phase 6 — Word components (depend on domain types)

### `components/words/MatchingDragOverlay.js` → `.tsx`
| | |
|---|---|
| **Lines** | 61 |
| **Effort** | **XS/S — 20–30 min** |

Very similar to `DragOverlay.tsx`. Props: `draggedWord: string | null`, `dragPosition: SharedValue<{x: number; y: number}>`, `isDragging: boolean`. Same `useAnimatedStyle` consideration as `DragOverlay`.

---

### `components/words/MatchingScrollArrows.js` → `.tsx`
| | |
|---|---|
| **Lines** | 88 |
| **Effort** | **XS — 20 min** |

**Key friction points:**

- Props: `isDragging: boolean`, `dragPosition: {x: number; y: number} | null`, `columnBounds: {left: number; right: number} | null`
- Two `useState<boolean>` values — inferred, no annotation needed
- Straightforward `useEffect` — no exotic hooks

---

### `components/words/MatchingColumn.js` → `.tsx`
| | |
|---|---|
| **Lines** | 311 |
| **Effort** | **L — 3–4 h** |

**Key friction points:**

- Two components: `MatchingWordItem` (memoised) and `MatchingColumn`
- `MatchingWordItem` props: `item: {id: string; text: string}`, drag callbacks typed as worklet-safe functions, `handleWordLayout`, `registerItemRef`
- `GestureDetector + Gesture.Pan()` with worklets — same as `VariantsList`, `scheduleOnRN` needs typing
- Callback ref pattern: `ref={(r) => { itemRef.current = r; registerItemRef(item.id, r) }}` — `r` is `View | null`
- `itemRefs = useRef(new Map<string, View | null>()).current` — type the Map explicitly
- `wordLayouts = useRef(new Map<string, LayoutRect>()).current`
- `measureInWindow` callback in `handleScroll` iterating over `itemRefs` — each `ref.measureInWindow` call needs typed params
- `MatchingColumn` props: `words: WordItem[]`, `fadingOutIds: string[]`, `wrongMatchIds: string[]`, `measureSignal: number`
- `FlatList<WordItem>` generic — `renderItem` typed as `ListRenderItem<WordItem>`
- `useCallback` with explicit return types on `handleWordLayout`, `registerItemRef`, `renderWord`

---

## Phase 7 — Selection screens (depend only on navigation types)

### `screens/auth/LoginScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 109 |
| **Effort** | **S — 30 min** |

- Props: `NativeStackScreenProps<RootStackParamList, 'Login'>` — destructure `{ navigation }`
- `useState<string>('')` for email/password — inferred
- No async, no animations, no domain types

---

### `screens/selection/LanguageSelectionScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 142 |
| **Effort** | **S — 30–45 min** |

- Props: `NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>`
- Define local `Language` type `{ id: string; name: string; flag: string }`
- `handleLanguageSelect(language: Language)` — straightforward

---

### `screens/selection/LearningTypeSelectionScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 161 |
| **Effort** | **S — 30 min** |

- Props: `NativeStackScreenProps<RootStackParamList, 'LearningTypeSelection'>`
- `route.params.selectedLanguage` typed via `RootStackParamList`
- `learningType: 'tables' | 'words'` passed to `navigate`
- Straightforward, no domain types

---

### `screens/selection/TopicSelectionScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 315 |
| **Effort** | **M — 1.5–2 h** |

- Props: `NativeStackScreenProps<RootStackParamList, 'TopicSelection'>`
- `getTopicsData()` returns different shapes based on `learningType` — define a discriminated union:
  ```ts
  type TableTopic = { id: string; name: string; description: string; tags: string[]; rows: string[]; columns: string[] };
  type WordTopic  = { id: string; name: string; description: string; tags: string[]; wordCount: number };
  type Topic = TableTopic | WordTopic;
  ```
- `renderTopic` item typed as `ListRenderItem<Topic>`; accessing `item.rows` requires narrowing or `as TableTopic`
- `useState<string[]>([])` for `selectedTopics`
- `FlatList<Topic>` generic

---

### `screens/selection/ExerciseSelectionScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 302 |
| **Effort** | **M — 1.5 h** |

- Props: `NativeStackScreenProps<RootStackParamList, 'ExerciseSelection'>`
- `Exercise` item type: `{ id: string; name: string; description: string; icon: string; difficulty: string; isImplemented: boolean }`
- `handleExerciseSelect` branches produce typed `navigate` calls — these will get exhaustiveness-checked against `RootStackParamList`
- No animations, no domain types beyond the imported param bag

---

## Phase 8 — Word exercise screens (depend on domain types + navigation)

### `screens/exercises/words/MultipleChoiceTranslationExerciseScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 429 |
| **Effort** | **L — 2.5–3 h** |

- Props: `NativeStackScreenProps<RootStackParamList, 'MultipleChoiceTranslationExercise'>`
- State types: `direction: 'native-to-studied' | 'studied-to-native' | null`, `exercise: MultipleChoiceExercise | null`, `currentQuestion: MultipleChoiceQuestion | null`
- `feedbackMessage: { type: 'success' | 'error'; text: string } | null` — define `FeedbackMessage` type
- `feedbackTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>`
- `score: number` (currently unused in display, but typed)
- All factory types from `utils/domain.ts`

---

### `screens/exercises/words/TypingTranslationExerciseScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 527 |
| **Effort** | **L — 3 h** |

- Props: `NativeStackScreenProps<RootStackParamList, 'TypingTranslationExercise'>`
- `inputRef: React.RefObject<TextInput>` — then `inputRef.current.focus()` is typed
- `normalizeForComparison(str: string): string` — easy to type, but verify `@sindresorhus/transliterate` default import works under `esModuleInterop`
- State: same direction/exercise/question pattern as `MultipleChoiceTranslationExerciseScreen`
- `userInput: string`, `isInputFocused: boolean`
- `TextInput` value/onChangeText props already typed by RN
- Complex `handleSubmit` with async side effects — `async` return `Promise<void>` should infer fine

---

### `screens/exercises/words/MatchingColumnsExerciseScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 569 |
| **Effort** | **XL — 4–5 h** |

- Props: `NativeStackScreenProps<RootStackParamList, 'MatchingColumnsExercise'>`
- Multiple `Map` refs: `leftWordLayouts`, `rightWordLayouts`, `dragStartLayoutsRef` — type as `React.MutableRefObject<Map<string, LayoutRect>>`; note `dragStartLayoutsRef` uses `.current = new Map()` not `.current` pattern
- `selectedLeft/Right: string | null`, `hoveredId: string | null`, `fadingOutIds: string[]`, `wrongMatchIds: string[]`
- `draggedWord: string | null`, `dragPosition: {x: number; y: number}`, `measureSignal: number`
- `feedbackTimeoutRef`, `wrongMatchTimeoutRef` — `ReturnType<typeof setTimeout> | null`
- `exerciseState: MatchingColumnsExercise` from domain
- `handleLayoutChange` returns a curried callback — complex higher-order function type
- `isCorrectMatch` checks `exerciseState.matches` — type `matches` as `[string, string][]`
- Drag handlers pass item IDs and absolute coordinates — all typed after `MatchingColumn` prop types are established

---

## Phase 9 — Table exercise screens (most complex; depend on all prior phases)

### `screens/exercises/tables/FillCellsExerciseScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 593 |
| **Effort** | **XL — 5–6 h** |

- Props: `NativeStackScreenProps<RootStackParamList, 'FillCellsExercise'>` (currently ignores `route.params` — decide to wire params or keep `undefined`)
- `exerciseState: FillCellsExercise` from domain
- Legacy `Animated`: `flyingVariantPosition: Animated.ValueXY`, `flyingVariantWidth: Animated.Value` — correctly typed by RN core
- `selectedVariantRef: React.RefObject<TouchableOpacity> | null`
- `animateVariantToCell` is `async` returning `Promise<void>` — the inner `new Promise<void>((resolve) => …)` needs explicit generic
- `getGlobalPosition` returns `Promise<{x: number; y: number; width: number; height: number} | null>` — define `LayoutRect`
- `cellLayouts: Map<string, LayoutRect>` — `useRef(new Map()).current` needs typing
- `handleVariantDragUpdate` iterates `cellLayouts.entries()` — typed after `Map` is generified
- `getCellIsHovered` return type `boolean`
- `useSharedValue` import used but no shared values created in this file — check if import is vestigial
- `FeedbackMessage` type shared with word exercise screens — good candidate for a shared `types/ui.ts`

---

### `screens/exercises/tables/WordTransformationExerciseScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 577 |
| **Effort** | **XL — 5–6 h** |

- Props: same as `FillCellsExerciseScreen` (ignores `route.params`)
- `selectedLetters: Set<number>` — `useState<Set<number>>(new Set())`; immutable updates need `new Set(prev)` pattern or typed helper
- `tableScrollRef: React.RefObject<ScrollableTableHandle>` — needs `ScrollableTableHandle` interface exported from `ScrollableTable.tsx`
- `workspaceScrollRef: React.RefObject<TransformationWorkspaceHandle>` — needs handle type from `TransformationWorkspace.tsx`
- `cellLayouts: React.MutableRefObject<Map<string, LayoutRect>>` (note: `useRef(new Map())` without `.current` — different pattern from `FillCellsExerciseScreen`)
- `wordDisplayRef: React.RefObject<View>`
- Legacy `Animated` + `Animated.ValueXY` for `flyingWordPosition`, `Animated.Value` for `flyingWordScale`
- `exerciseState.sequences` — `WordOperationSequence[]`; `currentSequence.operations[currentSequence.currentOperation]` → `Operation`
- `generateWrongVariants` return type from domain
- Multiple `async` handlers with `measureInWindow` coordinate math

---

### `screens/exercises/tables/SentenceFittingExerciseScreen.js` → `.tsx`
| | |
|---|---|
| **Lines** | 670 |
| **Effort** | **XL — 5–7 h** |

- Props: same (ignores `route.params`)
- All the complexity of `WordTransformationExerciseScreen` plus:
  - `countdown: number`, `showingCompletedSentence: boolean`, `currentSentenceText: string`
  - `autoAdvanceTimeoutId: ReturnType<typeof setTimeout> | null` (stored in state — unusual pattern; may want `useRef` instead)
  - `sentenceTemplates: string[]` from domain — verify index type
  - `sentenceDisplayRef: React.RefObject<View>`
  - `CircularCountdown` props typed after `CircularCountdown.tsx` is done
  - Two `useEffect` countdown hooks — straightforward to type but adds surface area
  - No `ScrollableTable` / `tableScrollRef` — one fewer imperative handle

---

## Summary table

| File | Lines | Effort | Hours est. | Phase |
|------|------:|--------|:----------:|------:|
| `index.js` | 8 | XS | < 0.1 | 3 |
| `App.js` | 48 | S | 0.5 | 3 |
| `navigation/AppNavigator.js` | 95 | M | 1.5 | 2 |
| `components/shared/CircularCountdown.js` | 119 | S | 0.75 | 4 |
| `components/shared/VerticalArrowedScrollView.js` | 139 | M | 1.5 | 4 |
| `components/tables/AnimatedLetter.js` | 72 | S | 0.75 | 5 |
| `components/tables/AnimatedWord.js` | 153 | M | 1.5 | 5 |
| `components/tables/DragOverlay.js` | 62 | S | 0.5 | 5 |
| `components/tables/ScrollHandles.js` | 159 | M | 1.5 | 5 |
| `components/tables/TableCell.js` | 191 | M | 1.5 | 5 |
| `components/tables/TransformationWorkspace.js` | 218 | M | 2.0 | 5 |
| `components/tables/VariantsList.js` | 213 | M/L | 2.5 | 5 |
| `components/tables/ScrollableTable.js` | 431 | XL | 5.0 | 5 |
| `components/words/MatchingDragOverlay.js` | 61 | XS | 0.25 | 6 |
| `components/words/MatchingScrollArrows.js` | 88 | XS | 0.25 | 6 |
| `components/words/MatchingColumn.js` | 311 | L | 3.5 | 6 |
| `screens/auth/LoginScreen.js` | 109 | S | 0.5 | 7 |
| `screens/selection/LanguageSelectionScreen.js` | 142 | S | 0.5 | 7 |
| `screens/selection/LearningTypeSelectionScreen.js` | 161 | S | 0.5 | 7 |
| `screens/selection/TopicSelectionScreen.js` | 315 | M | 1.5 | 7 |
| `screens/selection/ExerciseSelectionScreen.js` | 302 | M | 1.5 | 7 |
| `screens/exercises/words/MultipleChoiceTranslationExerciseScreen.js` | 429 | L | 2.5 | 8 |
| `screens/exercises/words/TypingTranslationExerciseScreen.js` | 527 | L | 3.0 | 8 |
| `screens/exercises/words/MatchingColumnsExerciseScreen.js` | 569 | XL | 4.5 | 8 |
| `screens/exercises/tables/FillCellsExerciseScreen.js` | 593 | XL | 5.5 | 9 |
| `screens/exercises/tables/WordTransformationExerciseScreen.js` | 577 | XL | 5.5 | 9 |
| `screens/exercises/tables/SentenceFittingExerciseScreen.js` | 670 | XL | 6.0 | 9 |
| `utils/types.js` | 577 | XL | 6.0 | 1 |
| **Total** | **~7 300** | | **~61 h** | |

> **Rough total: ~60–65 developer-hours** spread across 9 phases, assuming no major rework.  
> Add ~4–6 h for bootstrapping (Phase 0) and fixing emergent `any` leaks during review.

---

## Cross-cutting types to define once and share

Create a `types/` folder alongside `utils/` with these shared interfaces to avoid duplication across files:

| Type | Used in |
|------|---------|
| `LayoutRect = { x: number; y: number; width: number; height: number }` | `TableCell`, `ScrollHandles`, `FillCellsExerciseScreen`, `WordTransformationExerciseScreen`, `MatchingColumnsExerciseScreen`, `MatchingColumn` |
| `FeedbackMessage = { type: 'success' \| 'error' \| 'completion'; text: string }` | All 5 exercise screens |
| `DragPosition = { x: number; y: number }` | `ScrollHandles`, `FillCellsExerciseScreen`, `MatchingColumnsExerciseScreen`, overlays |
| `ScrollableTableHandle = { scrollToCell(row: number, col: number): void }` | `ScrollableTable`, `WordTransformationExerciseScreen` |
| `ScrollWorkspaceHandle = { scrollTo(options: { y: number; animated?: boolean }): void }` | `VerticalArrowedScrollView`, `TransformationWorkspace`, sentence/transformation screens |
