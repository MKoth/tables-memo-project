# TypeScript migration friction scan

**Scope:** 28 `.js` files, zero `.ts`/`.tsx`, no `tsconfig`/`jsconfig`, no `PropTypes` or JSDoc. All friction is currently implicit.

---

## P1 — Highest impact (do these first)

### 1. Untyped React Navigation stack (11 screens, param bag pattern)

**Files:** `/Users/mihailcotelia/PersonalProject/tables-memo/navigation/AppNavigator.js`, all `screens/selection/*`, word exercise screens under `screens/exercises/words/`

**Why risky:** Every consumer uses `route.params || {}` with destructured fields and no shared contract. Params vary by screen (`selectedLanguage`, `learningType`, `selectedTopics`, `exerciseType`) and are passed through long navigate chains from `ExerciseSelectionScreen.js`.

**Extra friction:** Table exercise screens (`FillCellsExerciseScreen.js`, `WordTransformationExerciseScreen.js`, `SentenceFittingExerciseScreen.js`) ignore `route.params` entirely while selection flow still passes them — TS will force you to either wire params or narrow the param list.

**Example:** `ExerciseSelectionScreen.js` lines 10–11, 98–137 — navigate payloads are ad-hoc objects with no central `RootStackParamList`.

---

### 2. Domain model in `utils/types.js` (~578 lines, misnamed)

**File:** `/Users/mihailcotelia/PersonalProject/tables-memo/utils/types.js`

**Why risky:** This is the real type surface for the app — factories (`createCellData`, `createTableData`, `createWordTransformationExercise`, …), nested exercise state, diff operations, vocabulary, and sample data. Nothing is exported as interfaces; return types are inferred object literals only.

**Dynamic patterns:**
- Mutable ops: `op.variants = …` in `generateWordOperations` (line ~371)
- `diffToOps` builds `{ type: "delete" | "insert", … }` while `OPERATION_TYPES` exists elsewhere
- `sentenceMappings` keys use homoglyph infinitives (`'hablаr'`, `'comеr'`) — easy to typo under strict string unions
- `allGrammarRulesExplanations` / `tableGrammarRuleMapping` indexed by string keys with no exhaustiveness

**Downstream:** Every exercise screen imports from here; typing this file unlocks most of the app.

---

### 3. Reanimated + Gesture Handler + worklets

**Files:**
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/tables/ScrollableTable.js` (largest: `useAnimatedRef`, `useAnimatedScrollHandler`, `scheduleOnUI`, worklet scroll sync)
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/words/MatchingColumn.js`
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/tables/VariantsList.js`
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/tables/TableCell.js`, `AnimatedLetter.js`, drag overlays

**Why risky:** `'worklet'` callbacks, `scheduleOnRN`/`scheduleOnUI` bridging JS ↔ UI thread, and `useSharedValue` objects need correct Reanimated 4 + worklets typings. Callbacks passed into worklets (`onDragStart`, `onDragUpdate`, etc.) must be typed as worklet-safe or wrapped explicitly.

**Note:** `react-native-worklets` is a newer dependency; types may be incomplete or require package-bundled definitions.

---

### 4. Refs, `measureInWindow`, and `Map`-backed layout caches

**Files:**
- `/Users/mihailcotelia/PersonalProject/tables-memo/screens/exercises/words/MatchingColumnsExerciseScreen.js` — `Map` refs for drag hit-testing, timeout refs
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/words/MatchingColumn.js` — `itemRefs` / `wordLayouts` maps, callback refs
- `/Users/mihailcotelia/PersonalProject/tables-memo/screens/exercises/tables/FillCellsExerciseScreen.js`, `WordTransformationExerciseScreen.js`, `SentenceFittingExerciseScreen.js` — cell/word layout maps
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/tables/TableCell.js`

**Why risky:** Refs are untyped (`useRef(null)`), `measureInWindow` callbacks get implicit `any` parameters, and layout values are ad-hoc `{ x, y, width, height }` objects stored in `Map<string, …>` without a shared `LayoutRect` type. `TextInput` ref in `TypingTranslationExerciseScreen.js` needs `TextInput | null`.

---

### 5. `forwardRef` + imperative handles (and a ref-forwarding gap)

**Files:**
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/tables/ScrollableTable.js` — `useImperativeHandle` exposes `{ scrollToCell(row, col) }`; parent refs must be `ScrollableTableHandle`
- `/Users/mihailcotelia/PersonalProject/tables-memo/components/tables/TransformationWorkspace.js` — `forwardRef` passes `ref` to `VerticalArrowedScrollView`

**Why risky:** Parents call `tableScrollRef.current.scrollToCell(...)` and `workspaceScrollRef.current.scrollTo({ y: 0 })` (`WordTransformationExerciseScreen.js`, `SentenceFittingExerciseScreen.js`), but `/Users/mihailcotelia/PersonalProject/tables-memo/components/shared/VerticalArrowedScrollView.js` is **not** `forwardRef` — only internal `scrollRef`. Migration will surface this; you’ll need a typed imperative API (`scrollToTop` / `scrollTo`) on the scroll wrapper.

---

## P2 — Significant (large screens & state)

### 6. Large monolithic exercise screens with nested `useState`

**Files (approx. line counts):**
- `SentenceFittingExerciseScreen.js` (~670)
- `FillCellsExerciseScreen.js` (~593)
- `MatchingColumnsExerciseScreen.js` (~569)
- `TypingTranslationExerciseScreen.js` (~527)
- `WordTransformationExerciseScreen.js` (~577)

**Why risky:** No reducers/context, but many `useState` slices plus functional updates spreading `exerciseState` / `exercise`. Exercise objects from factories gain optional/mutable fields at runtime (`showHint`, `isCompleted`, `currentMatches`). Typing means defining discriminated unions per exercise type and tightening `setState` updaters.

**Pattern:** `useState(new Set())` for `selectedLetters` in transformation screens — needs `Set<number>` and immutable update helpers.

---

### 7. No component prop contracts anywhere

**All** `components/**` and `screens/**`

**Why risky:** Zero `PropTypes`, zero JSDoc `@param`. Every component destructures props inline (`ScrollableTable`, `TransformationWorkspace`, `AnimatedWord`, `MatchingWordItem`, etc.). TS migration requires defining ~20 prop interfaces; optional callbacks (`getCellIsHovered`, `registerCellLayout`, …) are especially verbose.

---

### 8. Mixed React Native `Animated` vs Reanimated

**Files:**
- Legacy RN `Animated`: `FillCellsExerciseScreen.js`, `WordTransformationExerciseScreen.js`, `SentenceFittingExerciseScreen.js`, `CircularCountdown.js` (`Animated.Value`, `Animated.timing`)
- Reanimated: most table/word UI components, `App.js` logger config

**Why risky:** Two animation type systems in one codebase; refs to `Animated.ValueXY` vs `SharedValue` are incompatible. TS makes the split explicit and may push refactors to consolidate on Reanimated.

---

## P3 — Moderate (libraries, modules, consistency)

### 9. Third-party packages without local typings in repo

| Package | Used in | Risk |
|--------|---------|------|
| `diff-match-patch` | `utils/types.js` | Default import + `diff_main` tuple `[number, string][]`; may need `@types/diff-match-patch` or a custom `.d.ts` |
| `@sindresorhus/transliterate` | `TypingTranslationExerciseScreen.js` | ESM default import; verify package ships types |
| Asset `require('./assets/fonts/ComicSansMS.ttf')` | `App.js` | Needs `declare module '*.ttf'` |
| `react-native-worklets` | `ScrollableTable.js`, gestures | May lack mature `@types` |

Navigation, Expo, Reanimated, RNGH, and SVG generally have community types once `typescript` + `@types/react` are added.

---

### 10. CommonJS / asset `require` (limited but real)

**File:** `/Users/mihailcotelia/PersonalProject/tables-memo/App.js` line 24 — `require('./assets/fonts/ComicSansMS.ttf')`

**Why risky:** Needs `allowSyntheticDefaultImports` / `esModuleInterop` and a module declaration for font assets. Only one `require` in app code (not widespread CommonJS).

---

### 11. Operation type string inconsistency

**Files:** `utils/types.js` (`OPERATION_TYPES`), `AnimatedWord.js` (literal `"delete"` / `"insert"` in branches), `TransformationWorkspace.js` (uses `OPERATION_TYPES`)

**Why risky:** Under strict unions, `AnimatedWord.js` comparisons won’t narrow against `OPERATION_TYPES` until aligned — otherwise union exhaustiveness warnings or silent mismatches.

---

### 12. `VerticalArrowedScrollView` rest spread

**File:** `/Users/mihailcotelia/PersonalProject/tables-memo/components/shared/VerticalArrowedScrollView.js` — `...scrollViewProps` forwarded to `ScrollView`

**Why risky:** Typing as `ScrollViewProps` vs custom props requires `Omit`/`Pick`; also uses `scrollViewProps.ref` hack (line 60) instead of `forwardRef`.

---

### 13. `utils/types.js` filename vs content

**Why risky:** Named like a types module but contains runtime data + factories. Renaming to `domain.ts` / `models.ts` during migration avoids confusion with `.d.ts` / type-only modules.

---

## P4 — Lower (still worth noting)

### 14. No reducers, but complex state machines in screens

No `useReducer`/`createContext` found — friction is local state volume, not reducer typing.

### 15. `react-native-svg` in one place

**File:** `CircularCountdown.js` — straightforward once RN types are in place.

### 16. `package.json` has no `devDependencies`

No TypeScript, ESLint, or `@types/*` yet — greenfield setup before file-by-file migration.

---

## Suggested migration order

1. Add TS + Expo/RN base config and asset module declarations.  
2. Model domain types from `utils/types.js` → shared `types/` or `domain/`.  
3. Define `RootStackParamList` in `AppNavigator.js` and fix param usage (including table screens).  
4. Type `ScrollableTable` imperative handle + fix `VerticalArrowedScrollView` ref API.  
5. Tackle gesture/Reanimated components.  
6. Convert large exercise screens last (they benefit from prior types).

---

## What’s *not* a major blocker

- **Mixed ESM exports:** Consistent `export default` per file; `utils/types.js` uses named exports only — normal for TS.  
- **CommonJS modules:** Minimal (`require` for font only).  
- **Reducers/context:** Absent, so no reducer-action union work.  

If you want, I can turn this into a file-by-file migration checklist with estimated effort per file (still in Ask mode — guidance only).